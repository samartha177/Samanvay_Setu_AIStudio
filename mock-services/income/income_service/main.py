"""Independent simulated Income Department API for the SIH prototype."""

from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="Simulated Income Department API",
    version="2025.26-demo",
    description="Local fictional data only; not a real government income API.",
)


class IncomeRecord(BaseModel):
    applicant_name: str
    annual_income: int
    financial_year: str


class IncomeLookupResponse(BaseModel):
    income_record: IncomeRecord
    query: dict[str, str]


class HealthResponse(BaseModel):
    status: str
    service: str
    simulated: bool
    timestamp: datetime


SEED_INCOME = {
    "CIT-1001": IncomeRecord(applicant_name="Aarav Sharma", annual_income=240000, financial_year="FY 2025/26"),
    "CIT-1002": IncomeRecord(applicant_name="Diya Verma", annual_income=315000, financial_year="FY 2025/26"),
}


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse(status="healthy", service="income-department", simulated=True, timestamp=datetime.now(UTC))


@app.get("/income/{citizen_id}", response_model=IncomeLookupResponse, tags=["Income"])
def get_income(citizen_id: str) -> IncomeLookupResponse:
    """Return a snake_case income record in a nested source-system envelope."""

    record = SEED_INCOME.get(citizen_id.upper())
    if record is None:
        raise HTTPException(status_code=404, detail="Simulated income record not found")
    return IncomeLookupResponse(income_record=record, query={"lookupKey": citizen_id.upper(), "registry": "ITR-DEMO"})
