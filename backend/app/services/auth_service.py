"""Registration and login rules."""

from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.errors import EmailAlreadyRegisteredError, InvalidCredentialsError
from app.models import User


class AuthService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def register(self, email: str, password: str) -> User:
        """Create a customer. Role is never taken from client input."""
        email = email.lower()
        if self._find_by_email(email) is not None:
            raise EmailAlreadyRegisteredError()

        user = User(email=email, hashed_password=hash_password(password), is_admin=False)
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def login(self, email: str, password: str) -> str:
        """Return an access token. Same error for unknown user / bad password."""
        user = self._find_by_email(email.lower())
        if user is None or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        return create_access_token(user.id)

    def _find_by_email(self, email: str) -> User | None:
        return self._db.query(User).filter(User.email == email).first()
