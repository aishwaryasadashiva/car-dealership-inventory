import pytest

MISSING_ID = 99999


# --------------------------------------------------------------------- list
def test_list_requires_authentication(client):
    assert client.get("/api/vehicles").status_code == 401


def test_list_rejects_an_invalid_token(client):
    response = client.get(
        "/api/vehicles", headers={"Authorization": "Bearer invalid-token"}
    )

    assert response.status_code == 401


def test_list_returns_all_vehicles_including_out_of_stock(
    client, customer_headers, make_vehicle
):
    make_vehicle(model="Corolla", quantity_in_stock=3)
    make_vehicle(model="Camry", quantity_in_stock=0)

    response = client.get("/api/vehicles", headers=customer_headers)

    assert response.status_code == 200
    assert {v["model"] for v in response.json()} == {"Corolla", "Camry"}


def test_every_vehicle_has_a_unique_id(client, customer_headers, make_vehicle):
    make_vehicle()
    make_vehicle()

    ids = [v["id"] for v in client.get("/api/vehicles", headers=customer_headers).json()]

    assert len(ids) == len(set(ids)) == 2


# ------------------------------------------------------------------- create
def test_create_requires_authentication(client, vehicle_payload):
    assert client.post("/api/vehicles", json=vehicle_payload).status_code == 401


def test_customers_cannot_create_vehicles(client, customer_headers, vehicle_payload):
    response = client.post(
        "/api/vehicles", headers=customer_headers, json=vehicle_payload
    )

    assert response.status_code == 403


def test_admin_can_create_a_vehicle(client, admin_headers, vehicle_payload):
    response = client.post("/api/vehicles", headers=admin_headers, json=vehicle_payload)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] > 0
    assert body["make"] == "Toyota"
    assert body["quantity_in_stock"] == 5
    assert body["image_url"] is None


def test_admin_can_create_a_vehicle_with_a_photo_url(
    client, admin_headers, vehicle_payload
):
    response = client.post(
        "/api/vehicles",
        headers=admin_headers,
        json={**vehicle_payload, "image_url": "https://example.com/car.jpg"},
    )

    assert response.status_code == 201
    assert response.json()["image_url"] == "https://example.com/car.jpg"


@pytest.mark.parametrize(
    "bad_fields",
    [
        {"price": 0},
        {"price": -5},
        {"quantity_in_stock": -1},
        {"make": ""},
        {"model": "   "},
        {"category": ""},
        {"image_url": "javascript:alert(1)"},
        {"image_url": "not a url"},
    ],
)
def test_create_rejects_invalid_data(client, admin_headers, vehicle_payload, bad_fields):
    response = client.post(
        "/api/vehicles", headers=admin_headers, json={**vehicle_payload, **bad_fields}
    )

    assert response.status_code == 422


def test_create_trims_surrounding_whitespace(client, admin_headers, vehicle_payload):
    response = client.post(
        "/api/vehicles",
        headers=admin_headers,
        json={**vehicle_payload, "make": "  Honda  "},
    )

    assert response.json()["make"] == "Honda"


# ------------------------------------------------------------------- update
def test_admin_can_update_a_vehicle(client, admin_headers, make_vehicle, vehicle_payload):
    vehicle = make_vehicle()

    response = client.put(
        f"/api/vehicles/{vehicle['id']}",
        headers=admin_headers,
        json={**vehicle_payload, "make": "Honda", "model": "Civic", "price": 1800000},
    )

    assert response.status_code == 200
    assert response.json()["make"] == "Honda"
    assert response.json()["price"] == 1800000


def test_customers_cannot_update_vehicles(
    client, customer_headers, make_vehicle, vehicle_payload
):
    vehicle = make_vehicle()

    response = client.put(
        f"/api/vehicles/{vehicle['id']}", headers=customer_headers, json=vehicle_payload
    )

    assert response.status_code == 403


def test_update_missing_vehicle_returns_404(client, admin_headers, vehicle_payload):
    response = client.put(
        f"/api/vehicles/{MISSING_ID}", headers=admin_headers, json=vehicle_payload
    )

    assert response.status_code == 404


def test_update_rejects_invalid_data(client, admin_headers, make_vehicle, vehicle_payload):
    vehicle = make_vehicle()

    response = client.put(
        f"/api/vehicles/{vehicle['id']}",
        headers=admin_headers,
        json={**vehicle_payload, "price": -1},
    )

    assert response.status_code == 422


# ------------------------------------------------------------------- delete
def test_admin_can_delete_a_vehicle(client, admin_headers, make_vehicle):
    vehicle = make_vehicle()

    response = client.delete(f"/api/vehicles/{vehicle['id']}", headers=admin_headers)

    assert response.status_code == 200
    remaining = client.get("/api/vehicles", headers=admin_headers).json()
    assert remaining == []


def test_customers_cannot_delete_vehicles(client, customer_headers, make_vehicle):
    vehicle = make_vehicle()

    response = client.delete(f"/api/vehicles/{vehicle['id']}", headers=customer_headers)

    assert response.status_code == 403


def test_delete_missing_vehicle_returns_404(client, admin_headers):
    assert client.delete(f"/api/vehicles/{MISSING_ID}", headers=admin_headers).status_code == 404


# ------------------------------------------------------------------- search
def search(client, headers, **params):
    return client.get("/api/vehicles/search", headers=headers, params=params)


def test_search_requires_authentication(client):
    assert client.get("/api/vehicles/search").status_code == 401


def test_search_by_make_is_partial_and_case_insensitive(
    client, customer_headers, make_vehicle
):
    make_vehicle(make="Toyota")
    make_vehicle(make="Honda")

    result = search(client, customer_headers, make="toyo").json()

    assert [v["make"] for v in result] == ["Toyota"]


def test_search_by_model(client, customer_headers, make_vehicle):
    make_vehicle(model="Corolla")
    make_vehicle(model="Camry")

    result = search(client, customer_headers, model="cam").json()

    assert [v["model"] for v in result] == ["Camry"]


def test_search_by_category(client, customer_headers, make_vehicle):
    make_vehicle(category="Sedan")
    make_vehicle(category="SUV")

    result = search(client, customer_headers, category="suv").json()

    assert [v["category"] for v in result] == ["SUV"]


def test_search_by_price_range_is_inclusive(client, customer_headers, make_vehicle):
    make_vehicle(price=500000)
    make_vehicle(price=1000000)
    make_vehicle(price=2000000)
    make_vehicle(price=3000000)

    result = search(client, customer_headers, min_price=1000000, max_price=2000000).json()

    assert sorted(v["price"] for v in result) == [1000000, 2000000]


def test_search_combines_filters_with_and(client, customer_headers, make_vehicle):
    make_vehicle(make="Toyota", category="SUV", price=3000000)
    make_vehicle(make="Toyota", category="Sedan", price=1500000)
    make_vehicle(make="Honda", category="SUV", price=1500000)

    result = search(
        client, customer_headers, make="toyota", category="suv", max_price=4000000
    ).json()

    assert len(result) == 1
    assert (result[0]["make"], result[0]["category"]) == ("Toyota", "SUV")


def test_search_in_stock_only_hides_sold_out_vehicles(
    client, customer_headers, make_vehicle
):
    make_vehicle(model="Available", quantity_in_stock=2)
    make_vehicle(model="SoldOut", quantity_in_stock=0)

    result = search(client, customer_headers, in_stock=True).json()

    assert [v["model"] for v in result] == ["Available"]


def test_search_without_matches_returns_an_empty_list(client, customer_headers, make_vehicle):
    make_vehicle()

    assert search(client, customer_headers, make="Ferrari").json() == []


def test_search_treats_like_wildcards_as_plain_text(client, customer_headers, make_vehicle):
    make_vehicle(make="Toyota")

    assert search(client, customer_headers, make="%").json() == []


def test_search_rejects_an_inverted_price_range(client, customer_headers):
    response = search(client, customer_headers, min_price=500, max_price=100)

    assert response.status_code == 422


# ----------------------------------------------------------------- purchase
def test_purchase_requires_authentication(client, make_vehicle):
    vehicle = make_vehicle()

    assert client.post(f"/api/vehicles/{vehicle['id']}/purchase").status_code == 401


def test_purchase_reduces_stock_by_one(client, customer_headers, make_vehicle):
    vehicle = make_vehicle(quantity_in_stock=2)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers
    )

    assert response.status_code == 200
    assert response.json()["quantity_in_stock"] == 1


def test_purchase_of_sold_out_vehicle_is_rejected_and_stock_stays_zero(
    client, customer_headers, make_vehicle
):
    vehicle = make_vehicle(quantity_in_stock=0)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers
    )

    assert response.status_code == 409
    stock = client.get("/api/vehicles", headers=customer_headers).json()[0]
    assert stock["quantity_in_stock"] == 0


def test_stock_can_never_go_below_zero(client, customer_headers, make_vehicle):
    vehicle = make_vehicle(quantity_in_stock=3)

    statuses = [
        client.post(
            f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers
        ).status_code
        for _ in range(5)
    ]

    assert statuses == [200, 200, 200, 409, 409]
    final = client.get("/api/vehicles", headers=customer_headers).json()[0]
    assert final["quantity_in_stock"] == 0


def test_purchase_missing_vehicle_returns_404(client, customer_headers):
    response = client.post(
        f"/api/vehicles/{MISSING_ID}/purchase", headers=customer_headers
    )

    assert response.status_code == 404


# ------------------------------------------------------------------ restock
def test_admin_can_restock(client, admin_headers, make_vehicle):
    vehicle = make_vehicle(quantity_in_stock=1)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        headers=admin_headers,
        json={"quantity": 4},
    )

    assert response.status_code == 200
    assert response.json()["quantity_in_stock"] == 5


def test_restock_makes_a_sold_out_vehicle_purchasable_again(
    client, admin_headers, customer_headers, make_vehicle
):
    vehicle = make_vehicle(quantity_in_stock=0)
    client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        headers=admin_headers,
        json={"quantity": 1},
    )

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/purchase", headers=customer_headers
    )

    assert response.status_code == 200


def test_customers_cannot_restock(client, customer_headers, make_vehicle):
    vehicle = make_vehicle()

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        headers=customer_headers,
        json={"quantity": 3},
    )

    assert response.status_code == 403


@pytest.mark.parametrize("quantity", [0, -3])
def test_restock_rejects_non_positive_quantities(
    client, admin_headers, make_vehicle, quantity
):
    vehicle = make_vehicle()

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        headers=admin_headers,
        json={"quantity": quantity},
    )

    assert response.status_code == 422


def test_restock_missing_vehicle_returns_404(client, admin_headers):
    response = client.post(
        f"/api/vehicles/{MISSING_ID}/restock", headers=admin_headers, json={"quantity": 1}
    )

    assert response.status_code == 404
