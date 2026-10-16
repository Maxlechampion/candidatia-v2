"""Configuration pytest partagee."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-32chars")


@pytest.fixture(scope="session")
def client() -> TestClient:
    from app.main import app
    return TestClient(app)
