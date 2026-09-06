"""Independent simulated Identity Department API for the SIH prototype."""

from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="Simulated Identity Department API",
    version="1.0.0-demo",
    description="Local fictional data only; not a real government identity API.",
)


class IdentityCitizen(BaseModel):
    citizen_id: str
    full_name: str
    dob: str
    mobile: str


class HealthResponse(BaseModel):
    status: str
    service: str
    simulated: bool
    timestamp: datetime


SEED_CITIZENS = {
    "CIT-1001": IdentityCitizen(citizen_id="CIT-1001", full_name="Aarav Sharma", dob="2003-07-14", mobile="9999999999"),
    "CIT-1002": IdentityCitizen(citizen_id="CIT-1002", full_name="Diya Verma", dob="2004-11-02", mobile="9888888888"),
}


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse(status="healthy", service="identity-department", simulated=True, timestamp=datetime.now(UTC))


@app.get("/citizens/{citizen_id}", response_model=IdentityCitizen, tags=["Citizens"])
def get_citizen(citizen_id: str) -> IdentityCitizen:
    """Return a direct, snake_case source-system citizen record."""

    citizen = SEED_CITIZENS.get(citizen_id.upper())
    if citizen is None:
        raise HTTPException(status_code=404, detail="Simulated identity record not found")
    return citizen
