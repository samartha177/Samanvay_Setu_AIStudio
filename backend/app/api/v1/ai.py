"""API routes for AI schema mapper."""

from typing import Any
from fastapi import APIRouter, Body
from app.ai.mapper import schema_mapper_service

router = APIRouter(prefix="/ai", tags=["AI Schema Mapper"])


@router.get("/status")
def get_ai_status() -> dict[str, Any]:
    """Return status of AI schema mapper."""
    return {
        "aiAvailable": schema_mapper_service.is_ai_available,
        "model": schema_mapper_service.settings.ai_schema_mapper_model,
        "deterministicAuthoritative": True,
        "registryVersion": "mapping-registry-v1",
    }


@router.post("/suggest-mapping")
def suggest_mapping(payload: dict[str, Any] = Body(...)) -> dict[str, Any]:
    """Suggest canonical mappings for arbitrary departmental fields.

    Review-only advisory output. Deterministic registry remains authoritative.
    """
    fields_payload = payload.get("schema") or payload.get("rawSchema") or payload
    return schema_mapper_service.suggest_custom_fields(fields_payload)
