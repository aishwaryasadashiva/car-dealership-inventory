from app.models import User, Vehicle
from app.seed import DEMO_VEHICLES, ensure_admin, seed_vehicles


def test_ensure_admin_creates_an_admin_who_can_log_in(client, db_session):
    ensure_admin(db_session, "boss@example.com", "AdminPassword123!")

    response = client.post(
        "/api/auth/login",
        data={"username": "boss@example.com", "password": "AdminPassword123!"},
    )
    token = response.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert me.json()["is_admin"] is True


def test_ensure_admin_is_idempotent(db_session):
    ensure_admin(db_session, "boss@example.com", "AdminPassword123!")
    ensure_admin(db_session, "Boss@Example.com", "AdminPassword123!")

    assert db_session.query(User).count() == 1


def test_ensure_admin_promotes_an_existing_customer(db_session):
    db_session.add(User(email="boss@example.com", hashed_password="x", is_admin=False))
    db_session.commit()

    ensure_admin(db_session, "boss@example.com", "AdminPassword123!")

    assert db_session.query(User).one().is_admin is True


def test_seed_vehicles_populates_an_empty_inventory(db_session):
    created = seed_vehicles(db_session)

    assert created == len(DEMO_VEHICLES) >= 10
    assert db_session.query(Vehicle).count() == created


def test_seed_vehicles_never_duplicates_or_overwrites_existing_stock(db_session):
    seed_vehicles(db_session)
    first = db_session.query(Vehicle).first()
    first.quantity_in_stock = 99
    db_session.commit()

    assert seed_vehicles(db_session) == 0

    assert db_session.query(Vehicle).count() == len(DEMO_VEHICLES)
    assert db_session.get(Vehicle, first.id).quantity_in_stock == 99


def test_demo_data_includes_a_sold_out_vehicle_to_show_the_disabled_state():
    assert any(v["quantity_in_stock"] == 0 for v in DEMO_VEHICLES)
