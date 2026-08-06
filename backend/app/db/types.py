"""Portable UUID column type.

SQLAlchemy 2.0's built-in `Uuid` type is already dialect-portable: native
`UUID` on PostgreSQL, `CHAR(32)` elsewhere. Re-exported from one place so
every model imports it the same way, and so the test suite can run against
SQLite in-memory (fast, no live Postgres required — see tests/conftest.py)
while production (via DATABASE_URL) runs against real Postgres unchanged.
"""

from sqlalchemy import Uuid

GUID = Uuid
