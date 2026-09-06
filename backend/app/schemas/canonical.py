"""Canonical data models for SAMANVAYSETU interoperability boundary.

These Pydantic models define the versioned platform representation.
Adapters transform raw departmental source shapes into these canonical structures.
"""

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class CitizenProfile(BaseModel):
    citizen_id: str = Field(description="Unique citizen reference identifier")
    full_name: str = Field(description="Canonical normalized person name")
    date_of_birth: str = Field(description="ISO 8601 YYYY-MM-DD birth date")
    mobile: str | None = Field(default=None, description="Contact mobile number")


class EducationRecord(BaseModel):
    citizen_id: str = Field(description="Citizen identifier cross-reference")
    student_id: str = Field(description="Institution student registration id")
    student_name: str = Field(description="Normalized student name")
    date_of_birth: str = Field(description="ISO 8601 YYYY-MM-DD birth date")
    course_name: str = Field(description="Canonical degree/course name")
    institution_name: str = Field(description="Accredited institution name")
    enrollment_status: str = Field(description="Normalized enrollment status (e.g. ACTIVE)")


class IncomeRecord(BaseModel):
    citizen_id: str = Field(description="Citizen identifier cross-reference")
    applicant_name: str = Field(description="Verified taxpayer/applicant name")
    annual_income: int = Field(ge=0, description="Gross annual income in INR (₹)")
    financial_year: str = Field(description="Assessment financial year (e.g. FY 2025/26)")


class EligibilityCriterion(BaseModel):
    id: str
    name: str
    requirement: str
    actual: str
    passed: bool
    explanation: str


class EligibilityEvaluation(BaseModel):
    is_eligible: bool
    criteria: list[EligibilityCriterion]
    summary: str
    evaluated_at: datetime


class ScholarshipApplication(BaseModel):
    application_id: str = Field(description="Scholarship application reference")
    application_reference: str = Field(description="Gateway interoperability correlation reference")
    citizen_id: str
    student_id: str
    applicant_name: str
    date_of_birth: str
    course_name: str
    institution_name: str
    annual_income: int = Field(ge=0)
    financial_year: str
    eligibility_status: Literal["ELIGIBLE", "INELIGIBLE"]
    workflow_status: Literal["DRAFT", "PROCESSING", "SUBMITTED", "FAILED", "REJECTED"]
    eligibility_details: EligibilityEvaluation
    records_verified: dict[str, bool]
    departments_contacted: list[str]
    submission_receipt: dict[str, Any] | None = None
    audit_events: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    completed_at: datetime | None = None
    mode: Literal["real", "demo"] = "real"
