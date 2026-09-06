"""Database engine and session factory.

The foundation does not connect to PostgreSQL at import time. Connection use is
introduced with repository-backed workflow functionality in a later phase.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_engine():
    """Build an engine from the configured PostgreSQL connection string."""

    return create_engine(get_settings().database_url, pool_pre_ping=True)


def build_session_factory() -> sessionmaker[Session]:
    """Create a session factory without opening a database connection."""

    return sessionmaker(bind=build_engine(), autoflush=False, autocommit=False)
