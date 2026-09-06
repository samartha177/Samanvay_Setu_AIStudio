"""SQLAlchemy declarative base used by SAMANVAYSETU persistence models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all PostgreSQL-backed models."""

