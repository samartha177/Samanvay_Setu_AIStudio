"""Independent simulated Scholarship Department API for the SIH prototype."""

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Simulated Scholarship Department API",
    version="1.8.0-demo",
    description="Local fictional data only; not a real government scholarship API.",
)


class CanonicalScholarshipApplication(BaseModel):
    application_reference: str = Field(description="Gateway-generated reference")
    citizen_id: str
    applicant_name: str
    date_of_birth: str
    course_name: str
    institution_name: str
    annual_income: int = Field(ge=0)
    financial_year: str


class SubmissionReceipt(BaseModel):
    application_id: str
    application_reference: str
    status: str
    received_at: datetime
    source: str


class HealthResponse(BaseModel):
    status: str
    service: str
    simulated: bool
    timestamp: datetime


SUBMISSIONS: dict[str, CanonicalScholarshipApplication] = {}
RECEIPTS: dict[str, SubmissionReceipt] = {}


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse(status="healthy", service="scholarship-department", simulated=True, timestamp=datetime.now(UTC))


@app.post("/applications", response_model=SubmissionReceipt, status_code=status.HTTP_201_CREATED, tags=["Applications"])
def submit_application(payload: CanonicalScholarshipApplication) -> SubmissionReceipt:
    """Accept the canonical payload produced by the interoperability gateway."""

    application_id = f"SCH-{uuid4().hex[:10].upper()}"
    receipt = SubmissionReceipt(application_id=application_id, application_reference=payload.application_reference, status="RECEIVED", received_at=datetime.now(UTC), source="SCHOLARSHIP-CORE-DEMO")
    SUBMISSIONS[application_id] = payload
    RECEIPTS[application_id] = receipt
    return receipt


@app.get("/applications/{application_id}", response_model=SubmissionReceipt, tags=["Applications"])
def get_application(application_id: str) -> SubmissionReceipt:
    receipt = RECEIPTS.get(application_id.upper())
    if receipt is None:
        raise HTTPException(status_code=404, detail="Simulated scholarship application not found")
    return receipt
