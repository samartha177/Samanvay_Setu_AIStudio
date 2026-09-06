"""Independent simulated Education Department API for the SIH prototype."""

from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(
    title="Simulated Education Department API",
    version="2.3.0-demo",
    description="Local fictional data only; not a real government education API.",
)


class StudentRecord(BaseModel):
    studentId: str
    studentName: str
    birthDate: str
    courseName: str
    institutionName: str


class StudentLookupResponse(BaseModel):
    student: StudentRecord
    verification: dict[str, str]


class HealthResponse(BaseModel):
    status: str
    service: str
    simulated: bool
    timestamp: datetime


SEED_STUDENTS = {
    "STU-5001": StudentRecord(studentId="STU-5001", studentName="Aarav Sharma", birthDate="14/07/2003", courseName="B.Tech Computer Engineering", institutionName="Innovexa Institute"),
    "STU-5002": StudentRecord(studentId="STU-5002", studentName="Diya Verma", birthDate="02/11/2004", courseName="B.Sc Data Science", institutionName="Innovexa Institute"),
}


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse(status="healthy", service="education-department", simulated=True, timestamp=datetime.now(UTC))


@app.get("/students/{student_id}", response_model=StudentLookupResponse, tags=["Students"])
def get_student(student_id: str) -> StudentLookupResponse:
    """Return a camelCase record in a department-specific nested envelope."""

    student = SEED_STUDENTS.get(student_id.upper())
    if student is None:
        raise HTTPException(status_code=404, detail="Simulated education record not found")
    return StudentLookupResponse(student=student, verification={"recordStatus": "ACTIVE", "sourceSystem": "EDU-SIS"})
