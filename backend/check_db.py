"""TEMPORARY, read-only production database integrity check — POST-migration.

Verifies the full post-migration state after 2a72b314d0d2 -> b192831432f0
-> d9a17386e356 -> d10f45d0196e: every new table/column/index exists,
foreign keys are correct, and — critically — every pre-existing table and
its row counts are untouched (proving the migration was purely additive
in practice, not just in the SQL preview).

Performs ONLY reads (to_regclass, SELECT against pg_catalog/
information_schema/alembic_version, COUNT(*)) — no INSERT, UPDATE,
DELETE, DROP, CREATE, ALTER, or migration operation of any kind.

Not part of the application — delete once this audit is done. Usage
(PowerShell, from backend/, with DATABASE_URL already set):
    .venv/Scripts/python.exe check_db.py
"""

from __future__ import annotations

import asyncio
import os
import sys

import asyncpg

NEW_TABLES = (
    "interview_sessions",
    "interview_questions",
    "interview_answers",
    "community_groups",
    "community_memberships",
    "community_posts",
    "community_comments",
    "community_reactions",
)
PRE_EXISTING_TABLES = (
    "users",
    "profiles",
    "goals",
    "skill_gap_analyses",
    "skill_gap_items",
    "roadmaps",
    "roadmap_items",
    "cv_feedback_rounds",
    "cv_feedback_items",
    "company_profiles",
    "service_provider_profiles",
    "job_opportunities",
    "applications",
    "service_listings",
    "checkpoints",
    "checkpoint_blobs",
    "checkpoint_writes",
)
NEW_ENUM_TYPES = (
    "interviewexperiencelevel",
    "interviewtype",
    "interviewsessionstatus",
    "interviewquestioncategory",
    "interviewsessionmode",
    "communitygrouptype",
    "communityposttype",
)


async def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is not set in this shell session.", file=sys.stderr)
        sys.exit(1)
    dsn = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)

    conn = await asyncpg.connect(dsn)
    try:
        print("=== 1. alembic_version ===")
        version = await conn.fetchval("SELECT version_num FROM alembic_version")
        print(f"  {version}  (expect: d10f45d0196e)")

        print()
        print("=== 2. New tables exist ===")
        for table in NEW_TABLES:
            exists = await conn.fetchval("SELECT to_regclass($1)", f"public.{table}")
            print(f"  {table}: {'EXISTS' if exists else 'MISSING'}")

        print()
        print("=== 3. New enum types exist ===")
        rows = await conn.fetch(
            "SELECT typname FROM pg_type WHERE typname = ANY($1::text[]) ORDER BY typname",
            list(NEW_ENUM_TYPES),
        )
        found = {r["typname"] for r in rows}
        for t in NEW_ENUM_TYPES:
            print(f"  {t}: {'EXISTS' if t in found else 'MISSING'}")

        print()
        print("=== 4. confidencelevel unchanged (still exactly HIGH/MEDIUM/LOW) ===")
        rows = await conn.fetch(
            """
            SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'confidencelevel' ORDER BY enumsortorder
            """
        )
        print("  " + ", ".join(r["enumlabel"] for r in rows))

        print()
        print("=== 5. interview_sessions.mode column + interview_answers voice columns exist ===")
        rows = await conn.fetch(
            """
            SELECT table_name, column_name FROM information_schema.columns
            WHERE (table_name = 'interview_sessions' AND column_name = 'mode')
               OR (table_name = 'interview_answers' AND column_name IN
                   ('speech_rate_wpm','pause_count','filler_word_count','avg_volume_level','movement_level'))
            ORDER BY table_name, column_name
            """
        )
        for r in rows:
            print(f"  {r['table_name']}.{r['column_name']}")
        print(f"  ({len(rows)} column(s) found, expect 6)")

        print()
        print("=== 6. Foreign keys on new tables ===")
        rows = await conn.fetch(
            """
            SELECT tc.table_name, kcu.column_name, ccu.table_name AS references_table
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ANY($1::text[])
            ORDER BY tc.table_name, kcu.column_name
            """,
            list(NEW_TABLES),
        )
        for r in rows:
            print(f"  {r['table_name']}.{r['column_name']} -> {r['references_table']}")

        print()
        print("=== 7. Row counts: new tables (expect 0 — nothing written yet) ===")
        for table in NEW_TABLES:
            count = await conn.fetchval(f"SELECT count(*) FROM {table}")
            print(f"  {table}: {count}")

        print()
        print("=== 8. Row counts: pre-existing tables (sanity — nothing should look wiped) ===")
        for table in PRE_EXISTING_TABLES:
            try:
                count = await conn.fetchval(f"SELECT count(*) FROM {table}")
                print(f"  {table}: {count}")
            except Exception as exc:  # table missing would be a real problem
                print(f"  {table}: ERROR — {exc}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
