"""Inventory business rules, independent of FastAPI."""

from dataclasses import dataclass

from sqlalchemy import or_, update
from sqlalchemy.orm import Session

from app.errors import InvalidPriceRangeError, OutOfStockError, VehicleNotFoundError
from app.models import Vehicle
from app.schemas import VehicleInput


@dataclass(frozen=True)
class VehicleFilters:
    make: str | None = None
    model: str | None = None
    category: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    in_stock: bool = False
    q: str | None = None  # free text: matches make OR model OR category


def _contains(text: str) -> str:
    """LIKE pattern for 'contains text', with user-typed wildcards escaped."""
    escaped = text.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


class VehicleService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self) -> list[Vehicle]:
        return self._db.query(Vehicle).order_by(Vehicle.id).all()

    def search(self, filters: VehicleFilters) -> list[Vehicle]:
        if (
            filters.min_price is not None
            and filters.max_price is not None
            and filters.min_price > filters.max_price
        ):
            raise InvalidPriceRangeError()

        query = self._db.query(Vehicle)
        for column, value in (
            (Vehicle.make, filters.make),
            (Vehicle.model, filters.model),
            (Vehicle.category, filters.category),
        ):
            if value and value.strip():
                query = query.filter(column.ilike(_contains(value), escape="\\"))
        if filters.q and filters.q.strip():
            pattern = _contains(filters.q)
            query = query.filter(
                or_(
                    Vehicle.make.ilike(pattern, escape="\\"),
                    Vehicle.model.ilike(pattern, escape="\\"),
                    Vehicle.category.ilike(pattern, escape="\\"),
                )
            )
        if filters.min_price is not None:
            query = query.filter(Vehicle.price >= filters.min_price)
        if filters.max_price is not None:
            query = query.filter(Vehicle.price <= filters.max_price)
        if filters.in_stock:
            query = query.filter(Vehicle.quantity_in_stock > 0)
        return query.order_by(Vehicle.id).all()

    def create(self, data: VehicleInput) -> Vehicle:
        vehicle = Vehicle(**data.model_dump())
        self._db.add(vehicle)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def update(self, vehicle_id: int, data: VehicleInput) -> Vehicle:
        vehicle = self._get(vehicle_id)
        for field, value in data.model_dump().items():
            setattr(vehicle, field, value)
        self._db.commit()
        self._db.refresh(vehicle)
        return vehicle

    def delete(self, vehicle_id: int) -> None:
        self._db.delete(self._get(vehicle_id))
        self._db.commit()

    def purchase(self, vehicle_id: int) -> Vehicle:
        """Sell one unit.

        The stock check and the decrement happen in ONE conditional UPDATE, so
        two simultaneous buyers can never both take the last car (no
        read-then-write race, and stock cannot go negative).
        """
        result = self._db.execute(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id, Vehicle.quantity_in_stock > 0)
            .values(quantity_in_stock=Vehicle.quantity_in_stock - 1)
        )
        if result.rowcount == 0:
            self._db.rollback()
            self._get(vehicle_id)  # raises VehicleNotFoundError if it never existed
            raise OutOfStockError()

        self._db.commit()
        return self._get(vehicle_id)

    def restock(self, vehicle_id: int, quantity: int) -> Vehicle:
        self._db.execute(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .values(quantity_in_stock=Vehicle.quantity_in_stock + quantity)
        )
        self._db.commit()
        return self._get(vehicle_id)

    def _get(self, vehicle_id: int) -> Vehicle:
        vehicle = self._db.get(Vehicle, vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError()
        self._db.refresh(vehicle)
        return vehicle
