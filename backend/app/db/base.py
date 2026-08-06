from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for every Knowledge Layer / account-level
    table (SAS §3). Importing this module (via `app.db.models`) is what
    registers every table with Alembic's autogenerate."""
