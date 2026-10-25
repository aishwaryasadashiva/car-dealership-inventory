# Test Report

**Date:** 25 October 2026

| Suite | Tests | Passed | Failed | Time | Coverage (statements) |
|---|---:|---:|---:|---:|---:|
| Backend (pytest, FastAPI + SQLite in-memory) | 72 | 72 | 0 | ~3.5 s | **96 %** |
| Frontend (Vitest + Testing Library) | 48 | 48 | 0 | ~14 s | **86 %** |
| Frontend lint (ESLint) / typecheck (`tsc -b`) / build (`vite build`) | - | clean | - | - | - |

## Reproduce

```bash
# backend
cd backend
python -m pytest -q --cov=app --cov-report=term-missing

# frontend
cd frontend
npm test -- --coverage
npm run lint && npm run build
```

## Backend breakdown (72 tests)

| File | Tests | What it proves |
|---|---:|---|
| `test_auth.py` | 13 | Register (no hash leaked, duplicate email case-insensitive, short password, bad email), **registration cannot grant admin**, login (token, case-insensitive email, wrong password / unknown user both 401), `/me`, expired token, token of a deleted user |
| `test_vehicles.py` | 47 | List incl. sold-out and unique ids; create/update/delete **admin-only** (customer 403, anonymous 401, missing 404); validation (price, quantity, blank names, bad `image_url`); search by make / model / category / price (inclusive) / combined / `in_stock` / free-text `q` / wildcard escaping / inverted range; purchase decrements, 409 when sold out, **stock never below zero**, 404; restock admin-only, positive quantity only |
| `test_config.py` | 6 | JWT secret from env, strong random fallback, database URL and CORS parsing |
| `test_seed.py` | 6 | Admin bootstrap is idempotent and can promote an existing user; demo data seeded once, never overwrites stock |

Coverage by module (backend): auth 100 %, routers 100 %, services 100 %, schemas 100 %, main 100 %,
config 96 %, dependencies 82 %, `seed.py` 73 % (the untested lines are the `main()` command-line wrapper).

## Frontend breakdown (48 tests)

| File | Tests | What it proves |
|---|---:|---|
| `lib/emi.test.ts` | 5 | EMI formula against hand-checked values, down payment, 0 % rate, no loan needed, no NaN |
| `lib/format.test.ts` | 4 | Indian number grouping, lakh/crore shorthand, stock labels |
| `lib/photo.test.ts` | 6 | Wikipedia lookup, caching (one request per car), graceful `null` on every failure mode |
| `api/client.test.ts` | 7 | Bearer header, query building, form login, FastAPI error messages, offline message |
| `components/VehicleCard.test.tsx` | 7 | **Purchase disabled at zero stock**, low-stock warning, admin controls hidden from customers |
| `components/Dashboard.test.tsx` | 14 | Listing, purchase flow + reload, error toast, backend search / category calls, empty state, admin add / restock / confirmed delete, EMI drawer, expired session |
| `components/AuthScreen.test.tsx` | 5 | Sign in, register, server error, notice, show password |

## Process note

The backend suite was written **before** the implementation: the commit
`test: specify admin roles, /me, search, stock and config behaviour (red)` had
14 failing tests and 2 modules that did not exist; the next commit made all
72 pass; a third commit refactored `main.py` into routers and services with the
tests untouched. The frontend EMI / format / photo / card tests followed the same
red -> green order; the Dashboard, AuthScreen and API-client tests were written
afterwards to characterize the finished UI.

## Not covered

* No browser end-to-end test; real Wikipedia photos must be checked in a browser with internet access.
* No concurrent (multi-thread) purchase test; atomicity relies on the single conditional `UPDATE` (see `docs/DECISIONS.md`).
