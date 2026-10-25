
import uuid

from app.main import app
from app.models import User


def register_and_login(client, prefix="user"):
    email = f"{prefix}-{uuid.uuid4().hex}@example.com"
    password = "StrongPassword123!"

    registration = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert registration.status_code == 201

    login = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    assert login.status_code == 200

    token = login.json()["access_token"]
    return email, password, {"Authorization": f"Bearer {token}"}


def create_vehicle(client, headers, quantity=5):
    response = client.post(
        "/api/vehicles",
        headers=headers,
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 1500000,
            "quantity_in_stock": quantity,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_list_vehicles_returns_list(client):
    _, _, headers = register_and_login(client, "empty")

    response = client.get("/api/vehicles", headers=headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_vehicle_requires_authentication(client):
    response = client.post(
        "/api/vehicles",
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 1500000,
            "quantity_in_stock": 5,
        },
    )

    assert response.status_code == 401


def test_list_vehicles_requires_authentication(client):
    response = client.get("/api/vehicles")

    assert response.status_code == 401


def test_list_vehicles_rejects_invalid_token(client):
    response = client.get(
        "/api/vehicles",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


def test_search_vehicles_by_make(client):
    _, _, headers = register_and_login(client, "search")

    created = client.post(
        "/api/vehicles",
        headers=headers,
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 1500000,
            "quantity_in_stock": 5,
        },
    )
    assert created.status_code == 201

    response = client.get(
        "/api/vehicles/search?make=Toyota",
        headers=headers,
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert all(vehicle["make"] == "Toyota" for vehicle in response.json())


def test_search_vehicles_by_price_range(client):
    _, _, headers = register_and_login(client, "price")

    created = client.post(
        "/api/vehicles",
        headers=headers,
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 1500000,
            "quantity_in_stock": 5,
        },
    )
    assert created.status_code == 201

    response = client.get(
        "/api/vehicles/search?min_price=1000000&max_price=2000000",
        headers=headers,
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert all(
        1000000 <= vehicle["price"] <= 2000000
        for vehicle in response.json()
    )


def test_purchase_vehicle_reduces_stock(client):
    _, _, headers = register_and_login(client, "buyer")
    vehicle = create_vehicle(client, headers, quantity=2)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/purchase",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["quantity_in_stock"] == 1


def test_purchase_vehicle_rejects_out_of_stock_vehicle(client):
    _, _, headers = register_and_login(client, "buyer")
    vehicle = create_vehicle(client, headers, quantity=0)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/purchase",
        headers=headers,
    )

    assert response.status_code == 409


def test_restock_vehicle_rejects_non_admin(client):
    _, _, headers = register_and_login(client, "restock")
    vehicle = create_vehicle(client, headers, quantity=2)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        headers=headers,
        json={"quantity": 3},
    )

    assert response.status_code == 403


def test_delete_vehicle_rejects_non_admin(client):
    _, _, headers = register_and_login(client, "delete")
    vehicle = create_vehicle(client, headers, quantity=2)

    response = client.delete(
        f"/api/vehicles/{vehicle['id']}",
        headers=headers,
    )

    assert response.status_code == 403


def test_admin_can_update_vehicle(client):
    email, password, _ = register_and_login(client, "update-admin")

    # Use the temporary database provided by conftest.py.
    test_session_factory = app.state.TestingSessionLocal
    db = test_session_factory()
    try:
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        user.is_admin = True
        db.commit()
    finally:
        db.close()

    login = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    assert login.status_code == 200
    headers = {
        "Authorization": f"Bearer {login.json()['access_token']}"
    }

    vehicle = create_vehicle(client, headers)

    updated = {
        "make": "Honda",
        "model": "Civic",
        "category": "Sedan",
        "price": 1800000,
        "quantity_in_stock": 3,
    }

    response = client.put(
        f"/api/vehicles/{vehicle['id']}",
        json=updated,
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["make"] == "Honda"
    assert response.json()["price"] == 1800000


def test_non_admin_cannot_update_vehicle(client):
    _, _, headers = register_and_login(client, "update-user")
    vehicle = create_vehicle(client, headers)

    response = client.put(
        f"/api/vehicles/{vehicle['id']}",
        json={
            "make": "Honda",
            "model": "Civic",
            "category": "Sedan",
            "price": 1800000,
            "quantity_in_stock": 3,
        },
        headers=headers,
    )

    assert response.status_code == 403
