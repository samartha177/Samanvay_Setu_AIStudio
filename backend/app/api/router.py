"""Top-level API router."""

from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.scholarship import router as scholarship_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["System"])
api_router.include_router(scholarship_router)
