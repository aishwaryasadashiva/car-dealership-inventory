"""FastAPI application entry point: wiring only, no business logic."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_tables
from app.errors import DomainError
from app.routers import auth, vehicles


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(title="DriveSpace - Car Dealership Inventory API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content={"detail": error.detail})


app.include_router(auth.router)
app.include_router(vehicles.router)
