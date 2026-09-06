"""Create SAMANVAYSETU platform-owned persistence tables.

Revision ID: 0001_initial_platform_schema
Revises:
Create Date: 2026-09-06
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial_platform_schema"
down_revision = None
branch_labels = None
depends_on = None


def _id_column() -> sa.Column:
    return sa.Column("id", sa.String(length=36), primary_key=True, nullable=False)


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("users", _id_column(), sa.Column("email", sa.String(255), nullable=False), sa.Column("display_name", sa.String(160), nullable=False), sa.Column("role", sa.String(40), nullable=False), sa.Column("is_active", sa.Boolean(), nullable=False), *_timestamps(), sa.UniqueConstraint("email"))
    op.create_index("ix_users_email", "users", ["email"])
    op.create_table("citizens", _id_column(), sa.Column("citizen_id", sa.String(50), nullable=False), sa.Column("full_name", sa.String(160), nullable=False), sa.Column("date_of_birth", sa.String(10), nullable=False), sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id")), *_timestamps(), sa.UniqueConstraint("citizen_id"))
    op.create_index("ix_citizens_citizen_id", "citizens", ["citizen_id"])
    op.create_table("departments", _id_column(), sa.Column("code", sa.String(50), nullable=False), sa.Column("name", sa.String(160), nullable=False), sa.Column("is_simulated", sa.Boolean(), nullable=False), *_timestamps(), sa.UniqueConstraint("code"))
    op.create_table("apis", _id_column(), sa.Column("department_id", sa.String(36), sa.ForeignKey("departments.id"), nullable=False), sa.Column("name", sa.String(160), nullable=False), sa.Column("base_url", sa.String(500), nullable=False), sa.Column("health_path", sa.String(255), nullable=False), sa.Column("contract_version", sa.String(40), nullable=False), *_timestamps())
    op.create_table("applications", _id_column(), sa.Column("reference_number", sa.String(80), nullable=False), sa.Column("citizen_id", sa.String(36), sa.ForeignKey("citizens.id"), nullable=False), sa.Column("service_code", sa.String(80), nullable=False), sa.Column("status", sa.String(50), nullable=False), sa.Column("canonical_payload", sa.JSON(), nullable=False), sa.Column("eligibility_status", sa.String(50)), *_timestamps(), sa.UniqueConstraint("reference_number"))
    op.create_index("ix_applications_reference_number", "applications", ["reference_number"])
    op.create_table("consents", _id_column(), sa.Column("citizen_id", sa.String(36), sa.ForeignKey("citizens.id"), nullable=False), sa.Column("department_id", sa.String(36), sa.ForeignKey("departments.id"), nullable=False), sa.Column("purpose", sa.String(255), nullable=False), sa.Column("data_categories", sa.JSON(), nullable=False), sa.Column("status", sa.String(40), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True)), *_timestamps())
    op.create_table("transactions", _id_column(), sa.Column("correlation_id", sa.String(80), nullable=False), sa.Column("application_id", sa.String(36), sa.ForeignKey("applications.id")), sa.Column("department_id", sa.String(36), sa.ForeignKey("departments.id")), sa.Column("operation", sa.String(100), nullable=False), sa.Column("status", sa.String(50), nullable=False), sa.Column("request_payload", sa.JSON()), sa.Column("response_payload", sa.JSON()), sa.Column("duration_ms", sa.Integer()), *_timestamps(), sa.UniqueConstraint("correlation_id"))
    op.create_index("ix_transactions_correlation_id", "transactions", ["correlation_id"])
    op.create_table("audit_logs", _id_column(), sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id")), sa.Column("event_type", sa.String(100), nullable=False), sa.Column("entity_type", sa.String(100), nullable=False), sa.Column("entity_id", sa.String(80), nullable=False), sa.Column("details", sa.JSON(), nullable=False), *_timestamps())
    op.create_table("schema_mappings", _id_column(), sa.Column("department_id", sa.String(36), sa.ForeignKey("departments.id"), nullable=False), sa.Column("source_field", sa.String(160), nullable=False), sa.Column("target_field", sa.String(160), nullable=False), sa.Column("transformation", sa.Text()), sa.Column("confidence", sa.Numeric(5, 4)), sa.Column("status", sa.String(40), nullable=False), *_timestamps())
    op.create_table("workflow_executions", _id_column(), sa.Column("application_id", sa.String(36), sa.ForeignKey("applications.id"), nullable=False), sa.Column("workflow_name", sa.String(120), nullable=False), sa.Column("status", sa.String(50), nullable=False), sa.Column("current_step", sa.String(120)), sa.Column("execution_context", sa.JSON(), nullable=False), sa.Column("started_at", sa.DateTime(timezone=True)), sa.Column("completed_at", sa.DateTime(timezone=True)), *_timestamps())


def downgrade() -> None:
    for table in ["workflow_executions", "schema_mappings", "audit_logs", "transactions", "consents", "applications", "apis", "departments", "citizens", "users"]:
        op.drop_table(table)
