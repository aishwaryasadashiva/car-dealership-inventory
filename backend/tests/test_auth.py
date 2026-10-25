from datetime import timedelta

from app.auth import create_access_token
from app.models import User

PASSWORD = "StrongPassword123!"


def register(client, email="alice@example.com", **extra):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": PASSWORD, **extra},
    )


def login(client, email="alice@example.com", password=PASSWORD):
    return client.post(
        "/api/auth/login", data={"username": email, "password": password}
    )


def test_register_creates_a_non_admin_user_without_leaking_the_hash(client):
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert body["is_admin"] is False
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_cannot_be_used_to_become_admin(client, db_session):
    response = register(client, is_admin=True)

    assert response.status_code == 201
    user = db_session.query(User).filter_by(email="alice@example.com").one()
    assert user.is_admin is False


def test_register_rejects_duplicate_email_case_insensitively(client):
    register(client, "alice@example.com")

    response = register(client, "ALICE@example.com")

    assert response.status_code == 409


def test_register_rejects_short_passwords(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "bob@example.com", "password": "short"},
    )

    assert response.status_code == 422


def test_register_rejects_invalid_email(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": PASSWORD},
    )

    assert response.status_code == 422


def test_login_returns_a_bearer_token(client):
    register(client)

    response = login(client)

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_is_case_insensitive_on_email(client):
    register(client)

    assert login(client, "ALICE@EXAMPLE.COM").status_code == 200


def test_login_rejects_wrong_password(client):
    register(client)

    assert login(client, password="WrongPassword123!").status_code == 401


def test_login_rejects_unknown_user_with_the_same_status(client):
    assert login(client, "ghost@example.com").status_code == 401


def test_me_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_the_current_user_and_role(client, customer_headers, admin_headers):
    customer = client.get("/api/auth/me", headers=customer_headers).json()
    admin = client.get("/api/auth/me", headers=admin_headers).json()

    assert customer["email"] == "customer@example.com"
    assert customer["is_admin"] is False
    assert admin["is_admin"] is True


def test_expired_tokens_are_rejected(client, db_session):
    register(client)
    user = db_session.query(User).filter_by(email="alice@example.com").one()
    expired = create_access_token(user.id, expires_delta=timedelta(minutes=-1))

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {expired}"}
    )

    assert response.status_code == 401


def test_token_for_a_deleted_user_is_rejected(client, db_session):
    register(client)
    token = login(client).json()["access_token"]
    db_session.query(User).delete()
    db_session.commit()

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401
