# Engineering decisions, trade-offs and limitations

This document records *why* the project looks the way it does, what I chose
not to build, and where it is weak. It is meant to be read before the code.

## 1. Reading the requirements

| Ambiguity in the brief | What I decided | Why |
|---|---|---|
| Only `DELETE` and `restock` are marked "Admin only", but the frontend section says admins get forms to *add, update and delete* | **`POST` and `PUT /api/vehicles` are admin-only too** | If any registered customer could `PUT` a vehicle, they could change its price and then buy it. The UI already treats add/edit as admin features, so the API must enforce the same rule. Tests: `test_customers_cannot_create_vehicles`, `test_customers_cannot_update_vehicles`. |
| "View a list of all **available** vehicles" | `GET /api/vehicles` returns *every* vehicle, including quantity 0 | The UI must show sold-out cars with a disabled Purchase button (explicit requirement), so the list endpoint cannot hide them. `GET /api/vehicles/search?in_stock=true` covers "only available". |
| "Search by make, model, category or price range" | Separate `make`, `model`, `category`, `min_price`, `max_price` parameters, **plus** `q` (free text) and `in_stock` | The spec'd parameters are all supported. `q` exists because a single search box in the UI should not need three round-trips or client-side filtering. |
| How does anyone become an admin? | `python -m app.seed` creates/promotes one from `ADMIN_EMAIL`/`ADMIN_PASSWORD`. **Registration can never set `is_admin`.** | The first version had no way to create an admin outside the test suite. A self-service "I am admin" flag would be a privilege-escalation bug (`test_register_cannot_be_used_to_become_admin`). |
| Purchase "decreasing its quantity" | One unit per purchase | Matches the wording; quantity-per-order would add a cart/order model the brief does not ask for. |

## 2. Architecture

```
HTTP  ->  routers/      parse + validate input, pick the required role
          services/     business rules (no FastAPI imports)
          models.py     SQLAlchemy tables
          errors.py     domain errors; ONE handler in main.py maps them to status codes
```

* **Single responsibility.** `main.py` only wires things together. Routers do
  HTTP. `VehicleService` / `AuthService` hold rules and can be tested without a web server.
* **Dependency inversion.** Services receive a `Session`; routers receive services through
  `Depends`. Tests swap the database by overriding one dependency (`get_db`).
* **Auth as a dependency.** `get_current_user` is applied once on the whole vehicles router
  (it is impossible to add an unprotected vehicle route by forgetting a decorator);
  `require_admin` is added per route.
* **Same error for unknown user and wrong password** on login, to avoid revealing which emails exist.

## 3. Correctness decisions worth defending

**Purchase is one conditional `UPDATE`:**

```sql
UPDATE vehicles SET quantity_in_stock = quantity_in_stock - 1
WHERE id = :id AND quantity_in_stock > 0
```

The "is there stock?" check and the decrement are a single atomic statement. The naive
version (read quantity, check in Python, write quantity - 1) has a race: two buyers both
read `1` and both succeed, leaving `-1`. If the statement touches 0 rows the service
distinguishes *not found* (404) from *sold out* (409) with a second lookup.
`test_stock_can_never_go_below_zero` buys repeatedly and asserts `[200, 200, 200, 409, 409]`.
Restock uses the same pattern (`quantity + n`) so concurrent restocks do not overwrite each other.

**LIKE wildcards are escaped.** Searching for `%` or `_` matches those literal characters
instead of everything (`test_search_treats_like_wildcards_as_plain_text`).

**Input is validated at the edge** with Pydantic: trimmed non-empty strings, `price > 0`,
`quantity >= 0`, restock `> 0`, and `image_url` must be `http(s)` (rejects `javascript:` URLs).

**Passwords** are hashed with Argon2 (via `pwdlib`); only the hash is stored and it is never returned.

## 4. Security trade-offs

| Choice | Trade-off |
|---|---|
| JWT in `sessionStorage` | Simple and cleared when the tab closes, but readable by any XSS. React escapes output by default and I avoid `dangerouslySetInnerHTML`; the more robust option is an `httpOnly` `SameSite` cookie, which needs CSRF handling - I judged that out of scope. |
| 30-minute access token, no refresh token | Limits the damage of a stolen token; the UI returns to the login screen with a message when it expires. A refresh flow would improve UX. |
| Role is read from the database on every request (`/api/auth/me`), not embedded in the token | A demoted admin loses power immediately. Costs one query per request. |
| Missing `JWT_SECRET_KEY` -> random per-process secret + warning | No hard-coded secret ever exists, and a fresh clone runs without setup. Downside: logins reset on restart and it breaks with several workers, so production must set the variable. |
| CORS limited to the Vite dev origins (configurable via `CORS_ORIGINS`) | Must be set for any deployed frontend. |

## 5. Frontend decisions

* **Search goes through the backend.** The first version filtered in the browser and never
  called `/api/vehicles/search`. Now every filter is a real API call, debounced by 300 ms, and a
  response is applied only if it is still the latest request (no stale overwrite).
* **The browser is never trusted for the role.** The admin flag comes from `/api/auth/me`;
  hiding buttons is only UX - the API enforces the rule (tested separately).
* **Native `<dialog>`** for modals: focus trapping, Escape and backdrop come from the browser.
* **EMI calculator** is a pure function (`lib/emi.ts`) with tests against hand-checked values
  (e.g. 10 lakh, 10 % p.a., 60 months -> ₹21,247.04).
* **Photos.** Committing copyrighted car images would be wrong, and hand-copying Commons URLs
  is brittle. The app asks Wikipedia for the lead image of the car's article at runtime
  (`lib/photo.ts`), caches it, links each photo to its source page, lets an admin override it
  with a `image_url`, and draws a silhouette if anything fails. Trade-off: it depends on
  Wikipedia being reachable, and the top search hit for an unusual model name could be the wrong
  article - the admin override is the escape hatch.

## 6. Testing strategy

* Backend tests were written **before** the new behaviour (see commit history: *red -> green -> refactor*).
* Each test gets a fresh in-memory SQLite database; the suite never touches `inventory.db`
  (the first version's auth tests wrote to the real database).
* Behaviour is tested through the HTTP API, so the refactor from one file into routers and
  services needed **zero test changes**.
* Frontend: pure logic (EMI, formatting, photo lookup, API client) is unit-tested; screens are
  tested with a mocked API. Those UI tests were written *after* the components - I label them
  honestly as characterization tests rather than pretending they were test-first.

## 7. Known limitations (and what I would do next)

1. **No migrations.** Schema changes need `Base.metadata.create_all`; an old `inventory.db`
   must be deleted when a column is added (I added `image_url`). Next: Alembic.
2. **Prices are `float`.** Fine for whole-rupee demo data; money should be integer paise or `Decimal`.
3. **Concurrency is argued, not load-tested.** The atomic `UPDATE` is correct by construction, but
   my test buys sequentially. Next: a threaded test against PostgreSQL.
4. **No purchase history.** A purchase just decrements stock; there is no order record or "my purchases" page.
5. **No pagination** on list/search - fine for a dozen cars, not for thousands.
6. **No rate limiting** on login, no password reset, no email verification.
7. **Browser behaviour is not covered by an end-to-end test** (no Playwright). The UI is covered by
   component tests with a mocked API.
8. **Wikipedia photo lookup** is unit-tested with a mocked `fetch`; it needs a real browser with internet access to show real photos.
9. **Not deployed.** Next: containerise, PostgreSQL, CI running both test suites on every push.

## 8. Questions I should be able to answer

* *Why is purchase a single UPDATE instead of read-then-write?* Section 3.
* *Why are POST and PUT admin-only when the brief only says DELETE and restock?* Section 1.
* *Why does the service layer not import FastAPI?* So business rules are testable and reusable without HTTP.
* *What happens if two people buy the last car at once?* One gets 200, the other 409; stock stays 0.
* *Where could a customer escalate to admin?* They cannot: registration ignores `is_admin`, the role is read from the DB on each request, and admin routes depend on `require_admin`.
* *What would you change first for production?* Migrations, PostgreSQL, httpOnly-cookie auth, CI, order history.
