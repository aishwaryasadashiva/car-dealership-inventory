
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import update
from app.dependencies import get_current_user, require_admin
from app.auth import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.config import settings
from app.database import SessionLocal, create_tables
from app.dependencies import get_current_user
from app.models import User, Vehicle
from app.schemas import (
    RestockRequest,
    TokenResponse,
    UserRegister,
    UserResponse,
    VehicleInput,
    VehicleResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(title="Car Dealership Inventory API", lifespan=lifespan)



app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def like_pattern(text: str) -> str:
    """Build a contains-pattern, escaping LIKE wildcards typed by the user."""
    escaped = text.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def vehicle_to_dict(vehicle: Vehicle):
    return VehicleResponse.model_validate(vehicle).model_dump()


@app.post(
    "/api/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    email = payload.email.lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user = User(email=email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form.username.lower()
    user = db.query(User).filter(User.email == email).first()

    if user is None or not verify_password(
        form.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }


@app.get("/api/auth/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/vehicles")
def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicles = db.query(Vehicle).all()
    return [vehicle_to_dict(vehicle) for vehicle in vehicles]


@app.get("/api/vehicles/search")
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    in_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=422,
            detail="min_price cannot be greater than max_price",
        )

    query = db.query(Vehicle)

    if make:
        query = query.filter(Vehicle.make.ilike(like_pattern(make), escape="\\"))

    if model:
        query = query.filter(Vehicle.model.ilike(like_pattern(model), escape="\\"))

    if category:
        query = query.filter(Vehicle.category.ilike(like_pattern(category), escape="\\"))

    if min_price is not None:
        query = query.filter(Vehicle.price >= min_price)

    if max_price is not None:
        query = query.filter(Vehicle.price <= max_price)

    if in_stock:
        query = query.filter(Vehicle.quantity_in_stock > 0)

    vehicles = query.all()
    return [vehicle_to_dict(vehicle) for vehicle in vehicles]


@app.post("/api/vehicles", status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle_to_dict(vehicle)



@app.post("/api/vehicles/{vehicle_id}/purchase")
def purchase_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.execute(
        update(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.quantity_in_stock > 0,
        )
        .values(quantity_in_stock=Vehicle.quantity_in_stock - 1)
    )

    if result.rowcount == 0:
        db.rollback()

        vehicle_exists = (
            db.query(Vehicle.id)
            .filter(Vehicle.id == vehicle_id)
            .first()
        )

        if vehicle_exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is out of stock",
        )

    db.commit()

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    return vehicle_to_dict(vehicle)






@app.post("/api/vehicles/{vehicle_id}/restock")
def restock_vehicle(
    vehicle_id: int,
    payload: RestockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    vehicle.quantity_in_stock += payload.quantity
    db.commit()
    db.refresh(vehicle)

    return vehicle_to_dict(vehicle)


@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    db.delete(vehicle)
    db.commit()

    return {"message": "Vehicle deleted successfully"}


@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    payload: VehicleInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    for field, value in payload.model_dump().items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle_to_dict(vehicle)
