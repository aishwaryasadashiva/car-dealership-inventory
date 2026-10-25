"""Domain errors raised by services.

Services know nothing about HTTP; ``main.py`` maps these to status codes.
"""


class DomainError(Exception):
    """Base class so one handler can translate every domain error."""

    status_code = 400
    detail = "Request could not be completed"

    def __init__(self, detail: str | None = None) -> None:
        super().__init__(detail or self.detail)
        self.detail = detail or self.detail


class VehicleNotFoundError(DomainError):
    status_code = 404
    detail = "Vehicle not found"


class OutOfStockError(DomainError):
    status_code = 409
    detail = "Vehicle is out of stock"


class EmailAlreadyRegisteredError(DomainError):
    status_code = 409
    detail = "Email is already registered"


class InvalidCredentialsError(DomainError):
    status_code = 401
    detail = "Invalid email or password"


class InvalidPriceRangeError(DomainError):
    status_code = 422
    detail = "min_price cannot be greater than max_price"
