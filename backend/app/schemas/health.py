"""Health endpoint response schema."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Public liveness information for the gateway."""

    status: Literal["healthy"] = Field(description="Current gateway status")
    service: str = Field(description="Service display name")
    version: str = Field(description="Application version")
    environment: str = Field(description="Runtime environment")
    timestamp: datetime = Field(description="UTC time at which health was evaluated")
