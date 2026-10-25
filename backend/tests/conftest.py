"""Shared pytest fixtures.

Every test gets a brand-new in-memory SQLite database, so tests never touch
the developer's real ``inventory.db`` and never depend on each other.
"""

import os

os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-key-for-local-tests-0123456789")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main_module
from app.auth import hash_password
from app.dependencies import get_db as dependencies_get_db
from app.main import app
from app.models import Base, User

PASSWORD = "StrongPassword123!"


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db_session(session_factory):
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(session_factory):
    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[dependencies_get_db] = override_get_db
    # The first version of the app defined a second get_db in main.py.
    if hasattr(main_module, "get_db"):
        app.dependency_overrides[main_module.get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def _create_user(db_session, email, is_admin):
    user = User(
        email=email,
        hashed_password=hash_password(PASSWORD),
        is_admin=is_admin,
    )
    db_session.add(user)
    db_session.commit()
    return user


def _login_headers(client, email):
    response = client.post(
        "/api/auth/login", data={"username": email, "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def customer_headers(client, db_session):
    _create_user(db_session, "customer@example.com", is_admin=False)
    return _login_headers(client, "customer@example.com")


@pytest.fixture
def admin_headers(client, db_session):
    _create_user(db_session, "admin@example.com", is_admin=True)
    return _login_headers(client, "admin@example.com")


@pytest.fixture
def vehicle_payload():
    return {
        "make": "Toyota",
        "model": "Corolla",
        "category": "Sedan",
        "price": 1500000,
        "quantity_in_stock": 5,
    }


@pytest.fixture
def make_vehicle(client, admin_headers, vehicle_payload):
    """Factory: create a vehicle through the real API as an admin."""

    def _make(**overrides):
        response = client.post(
            "/api/vehicles",
            headers=admin_headers,
            json={**vehicle_payload, **overrides},
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _make
