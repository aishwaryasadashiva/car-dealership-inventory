"""Request / response models (the public shape of the API)."""

from typing import Annotated
from urllib.parse import urlparse

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Category = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VehicleInput(BaseModel):
    """Fields an admin may set when creating or replacing a vehicle."""

    make: Name
    model: Name
    category: Category
    price: float = Field(gt=0)
    quantity_in_stock: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("image_url")
    @classmethod
    def image_url_must_be_http(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        parsed = urlparse(value.strip())
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError("image_url must be an http(s) URL")
        return value.strip()


class VehicleResponse(VehicleInput):
    model_config = ConfigDict(from_attributes=True)

    id: int


class RestockRequest(BaseModel):
    quantity: int = Field(gt=0)
