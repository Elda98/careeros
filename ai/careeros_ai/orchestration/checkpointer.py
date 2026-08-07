"""Persistent LangGraph checkpointer, backed by the same Postgres database
the rest of the app already uses (`langgraph-checkpoint-postgres`, already
a pinned dependency in `ai/requirements.txt` — this module is what actually
wires it up; previously installed but unused).

A checkpointer is what makes the supervisor graph's human-in-the-loop
interrupt survive a process restart: without persistence, an interrupted
graph's state only lives in memory, so a backend redeploy or restart while
a roadmap is awaiting approval would silently lose it. With a Postgres
checkpointer, the interrupted state is a real row in the database and can
be resumed by thread_id from any process, at any time.
"""

from __future__ import annotations

from contextlib import contextmanager
from collections.abc import Iterator

from langgraph.checkpoint.postgres import PostgresSaver


def _to_psycopg_dsn(database_url: str) -> str:
    """The app's DATABASE_URL uses the asyncpg SQLAlchemy scheme
    (`postgresql+asyncpg://...`); psycopg (what PostgresSaver uses) wants a
    plain `postgresql://...` DSN. Also normalizes the asyncpg-style `ssl=`
    query param to psycopg's `sslmode=`, if present, and adds a short
    connect_timeout — without one, psycopg's default is to wait
    indefinitely, which turns "Postgres is unreachable" (e.g. the hermetic
    test suite's default DATABASE_URL, nothing listening on localhost)
    into a multi-minute hang instead of the fast, graceful degrade
    `main.py`'s lifespan is actually designed for."""
    dsn = database_url.replace("+asyncpg", "", 1)
    dsn = dsn.replace("ssl=require", "sslmode=require").replace("ssl=true", "sslmode=require")
    if "connect_timeout=" not in dsn:
        separator = "&" if "?" in dsn else "?"
        dsn = f"{dsn}{separator}connect_timeout=3"
    return dsn


@contextmanager
def get_checkpointer(database_url: str, *, run_setup: bool = True) -> Iterator[PostgresSaver]:
    """Context manager yielding a ready-to-use `PostgresSaver` (mirrors
    `PostgresSaver.from_conn_string`'s own contract — it owns the
    underlying psycopg connection's lifetime, so callers must use this
    inside a `with` block, not hold the saver past it). `run_setup` creates
    the checkpoint tables if they don't exist yet (`CREATE TABLE IF NOT
    EXISTS` under the hood — safe to call on every use, not just once)."""
    dsn = _to_psycopg_dsn(database_url)
    with PostgresSaver.from_conn_string(dsn) as checkpointer:
        if run_setup:
            checkpointer.setup()
        yield checkpointer
