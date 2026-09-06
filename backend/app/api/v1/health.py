"""Foundation health endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/health")


@router.get("", response_model=HealthResponse, summary="Check API availability")
def get_health() -> HealthResponse:
    """Return API availability without depending on future integrations.

    Database and department dependency checks will be added when those
    services exist; this endpoint remains lightweight for load balancers and
    the frontend foundation.
    """

    settings = get_settings()
    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        timestamp=datetime.now(UTC),
    )
