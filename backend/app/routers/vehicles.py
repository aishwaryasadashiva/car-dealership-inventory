from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, require_admin
from app.schemas import RestockRequest, VehicleInput, VehicleResponse
from app.services.vehicle_service import VehicleFilters, VehicleService

# Every route needs a valid token; individual routes add require_admin on top.
router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)


def get_vehicle_service(db: Session = Depends(get_db)) -> VehicleService:
    return VehicleService(db)


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(service: VehicleService = Depends(get_vehicle_service)):
    return service.list_all()


# Declared before any "/{vehicle_id}" route so "search" is not parsed as an id.
@router.get("/search", response_model=list[VehicleResponse])
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    in_stock: bool = False,
    q: str | None = None,
    service: VehicleService = Depends(get_vehicle_service),
):
    return service.search(
        VehicleFilters(make, model, category, min_price, max_price, in_stock, q)
    )


@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_vehicle(payload: VehicleInput, service: VehicleService = Depends(get_vehicle_service)):
    return service.create(payload)


@router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    dependencies=[Depends(require_admin)],
)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleInput,
    service: VehicleService = Depends(get_vehicle_service),
):
    return service.update(vehicle_id, payload)


@router.delete("/{vehicle_id}", dependencies=[Depends(require_admin)])
def delete_vehicle(vehicle_id: int, service: VehicleService = Depends(get_vehicle_service)):
    service.delete(vehicle_id)
    return {"message": "Vehicle deleted successfully"}


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase_vehicle(vehicle_id: int, service: VehicleService = Depends(get_vehicle_service)):
    return service.purchase(vehicle_id)


@router.post(
    "/{vehicle_id}/restock",
    response_model=VehicleResponse,
    dependencies=[Depends(require_admin)],
)
def restock_vehicle(
    vehicle_id: int,
    payload: RestockRequest,
    service: VehicleService = Depends(get_vehicle_service),
):
    return service.restock(vehicle_id, payload.quantity)
