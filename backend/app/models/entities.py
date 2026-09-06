"""PostgreSQL entity models for the SAMANVAYSETU prototype.

These model platform-owned records only. Mock department source records remain
inside their independent simulated services and are not mirrored here.
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


def _id() -> str:
    return str(uuid4())


class Timestamped(Base):
    """Shared non-persisted base for created/updated timestamps."""

    __abstract__ = True
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class User(Timestamped):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    role: Mapped[str] = mapped_column(String(40), nullable=False, default="citizen")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Citizen(Timestamped):
    __tablename__ = "citizens"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    citizen_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    date_of_birth: Mapped[str] = mapped_column(String(10), nullable=False)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)


class Department(Timestamped):
    __tablename__ = "departments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class DepartmentApi(Timestamped):
    __tablename__ = "apis"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    department_id: Mapped[str] = mapped_column(ForeignKey("departments.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    health_path: Mapped[str] = mapped_column(String(255), nullable=False, default="/health")
    contract_version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")


class Application(Timestamped):
    __tablename__ = "applications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    reference_number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    citizen_id: Mapped[str] = mapped_column(ForeignKey("citizens.id"), nullable=False)
    service_code: Mapped[str] = mapped_column(String(80), nullable=False, default="SCHOLARSHIP")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    canonical_payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    eligibility_status: Mapped[str | None] = mapped_column(String(50), nullable=True)


class Consent(Timestamped):
    __tablename__ = "consents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    citizen_id: Mapped[str] = mapped_column(ForeignKey("citizens.id"), nullable=False)
    department_id: Mapped[str] = mapped_column(ForeignKey("departments.id"), nullable=False)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    data_categories: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="active")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Transaction(Timestamped):
    __tablename__ = "transactions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    correlation_id: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    application_id: Mapped[str | None] = mapped_column(ForeignKey("applications.id"), nullable=True)
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    operation: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    request_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)


class AuditLog(Timestamped):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(80), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class SchemaMapping(Timestamped):
    __tablename__ = "schema_mappings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    department_id: Mapped[str] = mapped_column(ForeignKey("departments.id"), nullable=False)
    source_field: Mapped[str] = mapped_column(String(160), nullable=False)
    target_field: Mapped[str] = mapped_column(String(160), nullable=False)
    transformation: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="approved")


class WorkflowExecution(Timestamped):
    __tablename__ = "workflow_executions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_id)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id"), nullable=False)
    workflow_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    current_step: Mapped[str | None] = mapped_column(String(120), nullable=True)
    execution_context: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
