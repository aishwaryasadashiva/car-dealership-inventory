"""Application settings, read from environment variables.

Kept as a pure function (``load_settings``) that receives the environment as
an argument, so it can be unit-tested without touching ``os.environ``.
"""

import logging
import os
import secrets
from collections.abc import Mapping
from dataclasses import dataclass

logger = logging.getLogger(__name__)

DEFAULT_DATABASE_URL = "sqlite:///./inventory.db"
DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]


@dataclass(frozen=True)
class Settings:
    jwt_secret_key: str
    secret_is_ephemeral: bool
    database_url: str
    cors_origins: list[str]
    access_token_minutes: int = 30


def load_settings(environ: Mapping[str, str]) -> Settings:
    secret = environ.get("JWT_SECRET_KEY")
    ephemeral = not secret
    if ephemeral:
        # Never fall back to a hard-coded secret: a random one is safe, it only
        # means tokens stop working when the server restarts.
        secret = secrets.token_urlsafe(48)

    origins = environ.get("CORS_ORIGINS")
    cors_origins = (
        [origin.strip() for origin in origins.split(",") if origin.strip()]
        if origins
        else list(DEFAULT_CORS_ORIGINS)
    )

    return Settings(
        jwt_secret_key=secret,
        secret_is_ephemeral=ephemeral,
        database_url=environ.get("DATABASE_URL", DEFAULT_DATABASE_URL),
        cors_origins=cors_origins,
    )


settings = load_settings(os.environ)

if settings.secret_is_ephemeral:
    logger.warning(
        "JWT_SECRET_KEY is not set - using a random secret for this process. "
        "Logins will be invalidated on restart. Set JWT_SECRET_KEY in production."
    )
