from app.config import load_settings


def test_uses_jwt_secret_from_environment():
    settings = load_settings({"JWT_SECRET_KEY": "x" * 40})

    assert settings.jwt_secret_key == "x" * 40
    assert settings.secret_is_ephemeral is False


def test_generates_a_strong_ephemeral_secret_when_missing():
    first = load_settings({})
    second = load_settings({})

    assert first.secret_is_ephemeral is True
    assert len(first.jwt_secret_key) >= 32
    assert first.jwt_secret_key != second.jwt_secret_key


def test_database_url_defaults_to_local_sqlite_file():
    assert load_settings({}).database_url == "sqlite:///./inventory.db"


def test_database_url_can_be_overridden():
    settings = load_settings({"DATABASE_URL": "sqlite:///./other.db"})

    assert settings.database_url == "sqlite:///./other.db"


def test_cors_origins_default_to_vite_dev_server():
    assert "http://localhost:5173" in load_settings({}).cors_origins


def test_cors_origins_are_parsed_from_comma_separated_list():
    settings = load_settings({"CORS_ORIGINS": "https://a.example, https://b.example"})

    assert settings.cors_origins == ["https://a.example", "https://b.example"]
