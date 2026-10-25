"""Demo data and first-admin bootstrap.

Run with:  python -m app.seed
Reads ADMIN_EMAIL / ADMIN_PASSWORD from the environment (local defaults below).
"""

import os

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal, create_tables
from app.models import User, Vehicle

# Illustrative prices in INR - demo data, not real quotes.
DEMO_VEHICLES: list[dict] = [
    {"make": "Maruti Suzuki", "model": "Swift", "category": "Hatchback", "price": 649000, "quantity_in_stock": 8},
    {"make": "Hyundai", "model": "i20", "category": "Hatchback", "price": 739000, "quantity_in_stock": 5},
    {"make": "Tata", "model": "Nexon", "category": "SUV", "price": 899000, "quantity_in_stock": 7},
    {"make": "Hyundai", "model": "Creta", "category": "SUV", "price": 1199000, "quantity_in_stock": 6},
    {"make": "Kia", "model": "Seltos", "category": "SUV", "price": 1090000, "quantity_in_stock": 4},
    {"make": "Mahindra", "model": "Thar", "category": "SUV", "price": 1199000, "quantity_in_stock": 3},
    {"make": "Toyota", "model": "Fortuner", "category": "SUV", "price": 3399000, "quantity_in_stock": 2},
    {"make": "Honda", "model": "City", "category": "Sedan", "price": 1190000, "quantity_in_stock": 5},
    {"make": "Skoda", "model": "Slavia", "category": "Sedan", "price": 1099000, "quantity_in_stock": 4},
    {"make": "Hyundai", "model": "Verna", "category": "Sedan", "price": 1099000, "quantity_in_stock": 0},
    {"make": "Toyota", "model": "Innova Crysta", "category": "MPV", "price": 1999000, "quantity_in_stock": 3},
    {"make": "Maruti Suzuki", "model": "Ertiga", "category": "MPV", "price": 899000, "quantity_in_stock": 6},
]


def ensure_admin(db: Session, email: str, password: str) -> User:
    """Create the admin, or promote the account if the email already exists."""
    email = email.lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email, hashed_password=hash_password(password), is_admin=True)
        db.add(user)
    else:
        user.is_admin = True
    db.commit()
    db.refresh(user)
    return user


def seed_vehicles(db: Session) -> int:
    """Insert demo vehicles only into an empty inventory. Returns rows created."""
    if db.query(Vehicle).count() > 0:
        return 0
    db.add_all(Vehicle(**vehicle) for vehicle in DEMO_VEHICLES)
    db.commit()
    return len(DEMO_VEHICLES)


def main() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@drivespace.dev")
    password = os.getenv("ADMIN_PASSWORD", "Admin@12345")
    create_tables()
    with SessionLocal() as db:
        ensure_admin(db, email, password)
        created = seed_vehicles(db)
    print(f"Admin ready: {email}")
    print(f"Demo vehicles added: {created}")


if __name__ == "__main__":
    main()
