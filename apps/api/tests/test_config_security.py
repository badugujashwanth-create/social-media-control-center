import base64

import pytest
from pydantic import ValidationError

from app.config import Settings


TOKEN_KEY = base64.urlsafe_b64encode(b'12345678901234567890123456789012').decode()


def test_production_rejects_default_or_short_signing_secret():
    with pytest.raises(ValidationError, match='SECRET_KEY'):
        Settings(
            _env_file=None,
            ENVIRONMENT='production',
            SECRET_KEY='change-me',
            TOKEN_ENCRYPTION_KEY=TOKEN_KEY,
            DEV_MODE=False,
        )


def test_production_rejects_developer_mode():
    with pytest.raises(ValidationError, match='DEV_MODE'):
        Settings(
            _env_file=None,
            ENVIRONMENT='production',
            SECRET_KEY='a-unique-production-signing-key-123456789',
            TOKEN_ENCRYPTION_KEY=TOKEN_KEY,
            DEV_MODE=True,
        )


def test_production_accepts_safe_runtime_configuration():
    settings = Settings(
        _env_file=None,
        ENVIRONMENT='production',
        SECRET_KEY='a-unique-production-signing-key-123456789',
        TOKEN_ENCRYPTION_KEY=TOKEN_KEY,
        DEV_MODE=False,
    )
    assert settings.environment == 'production'
    assert settings.dev_mode is False
