


from fastapi.testclient import TestClient

from app.main import app




def test_list_vehicles_returns_empty_list_initially():
    email = "inventory-reader@example.com"
    password = "StrongPassword123!"

    with TestClient(app) as client:
        registration = client.post(
            "/api/auth/register",
            json={"email": email, "password": password},
        )

        if registration.status_code == 201:
            assert registration.json()["email"] == email
        else:
            assert registration.status_code == 409

        login = client.post(
            "/api/auth/login",
            data={"username": email, "password": password},
        )
        assert login.status_code == 200

        token = login.json()["access_token"]
        response = client.get(
            "/api/vehicles",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.json() == []




def test_create_vehicle_requires_authentication():
    with TestClient(app) as client:
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


def test_list_vehicles_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/vehicles")

    assert response.status_code == 401


def test_list_vehicles_rejects_invalid_token():
    with TestClient(app) as client:
        response = client.get(
            "/api/vehicles",
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert response.status_code == 401
