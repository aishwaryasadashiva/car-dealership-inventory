
from fastapi.testclient import TestClient

from app.main import app




import uuid


def test_register_user():
    email = f"alice-{uuid.uuid4().hex}@example.com"

    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "StrongPassword123!",
            },
        )

    assert response.status_code == 201
    assert response.json()["email"] == email
    assert "hashed_password" not in response.json()




def test_login_returns_access_token():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={
                "email": "bob@example.com",
                "password": "StrongPassword123!",
            },
        )
        response = client.post(
            "/api/auth/login",
            data={
                "username": "bob@example.com",
                "password": "StrongPassword123!",
            },
        )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]
