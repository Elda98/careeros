# Pending Production Migrations — Interview Preparation, Video Interview, Community

**Status as of this writing: NOT applied to production.** The API routes for
all three features are live on Render (routes register at import time,
independent of the database), but any request that actually reads or
writes their tables will fail until the migrations below are applied. Do
not treat these features as production-ready until this document's
verification checklist passes.

## Why this wasn't done automatically

The development environment these three migrations were authored in has no
network path to the production database:

- A direct `alembic upgrade head` attempt failed at DNS resolution
  (the local `.env`'s `DATABASE_URL` template points at `postgres:5432`,
  the Docker Compose-internal hostname — not a real address from outside
  Docker).
- Render's one-off **Jobs** feature (`render jobs create ... --start-command
  "alembic upgrade head"`) requires a paid plan: `Error: received response
  code 400: new paid services not allowed`.
- Render's CLI **`ssh`** command only supports an interactive terminal
  session, which a non-interactive environment can't drive.
- Render's own hosted Postgres instance (`careeros-postgres`, likely a
  leftover from the free-tier connectivity issue documented in the root
  README's Deployment status, before the project moved to Neon) rejected
  the connection with `IP address ... not in allow list`.

Every migration file was still written and verified — each one was run
through `alembic upgrade <revision> --sql`, which generates the exact DDL
Postgres will execute without needing a live connection, and that output
was reviewed line-by-line (recorded in each migration's own commit
message). What's missing is only the final `alembic upgrade head` against
the real database, which requires real credentials this environment does
not have.

## What's pending

Three migrations, in this order, on top of the already-applied
`2a72b314d0d2` (Service Provider MVP — the last confirmed-applied
migration):

| Revision | Feature | Tables/columns added |
|---|---|---|
| `b192831432f0` | Interview Preparation | `interview_sessions`, `interview_questions`, `interview_answers` |
| `d9a17386e356` | Video Interview | `interview_sessions.mode` column; 5 nullable voice-signal columns on `interview_answers` |
| `d10f45d0196e` | Community | `community_groups`, `community_memberships`, `community_posts`, `community_comments`, `community_reactions` |

All three are purely additive (new tables, or new nullable columns with a
`server_default` on existing tables) — no `DROP`, no data mutation, no
change to any existing table's existing rows. Nothing in these migrations
touches the LangGraph checkpoint tables (`checkpoints`, `checkpoint_blobs`,
`checkpoint_writes`, `checkpoint_migrations`) or any Phase 0/ecosystem
table from earlier milestones.

## The exact procedure to run

Pick **one** of the two options below. Both are safe — this is additive
schema only, and `alembic upgrade head` is idempotent (safe to re-run; it
no-ops if already at head).

### Option A — Render's dashboard Shell (try this first; no local setup needed)

1. Go to <https://dashboard.render.com> and open the **careeros-backend**
   service.
2. Open the **Shell** tab (a browser-based terminal into the running
   container — this is a different feature from the CLI's `render ssh`/
   `render jobs`, and has historically been available on Render's free web
   service tier; if the tab isn't available on the current plan, use
   Option B instead).
3. Run:
   ```bash
   alembic upgrade head
   ```
4. Confirm the output shows all three revisions applying in order
   (`... -> b192831432f0`, `... -> d9a17386e356`, `... -> d10f45d0196e`).

### Option B — A local machine with real network access

1. Get the real `DATABASE_URL` — from the Render dashboard
   (**careeros-backend** → **Environment** tab) or directly from Neon's own
   dashboard (**Connection Details**). Copy it somewhere private; **never**
   paste it into a shared document, chat, or commit it to the repository.
2. On that machine:
   ```bash
   git clone https://github.com/Elda98/careeros.git   # or pull if already cloned
   cd careeros/backend
   python -m venv .venv && .venv\Scripts\activate      # or: source .venv/bin/activate
   pip install -r requirements-dev.txt
   ```
3. Set the real connection string for this shell session only (do not add
   it to a file that gets committed):
   - PowerShell: `$env:DATABASE_URL = "postgresql+asyncpg://...`
   - bash/zsh: `export DATABASE_URL="postgresql+asyncpg://..."`
4. Run:
   ```bash
   alembic upgrade head
   ```
5. Confirm the same three-revision output as Option A.

**Do not** use Neon's web SQL console to paste the raw DDL from the
`--sql` dry-runs directly — that would create the tables without updating
Alembic's own `alembic_version` tracking row, leaving the migration state
inconsistent for every future migration. Only use Option A or B.

## Verification checklist (run after either option)

1. `alembic current` → should print `d10f45d0196e (head)`.
2. Confirm the 8 new tables exist and the checkpoint tables are untouched:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
   ```
   Expect to see (among the existing tables) all of: `interview_sessions`,
   `interview_questions`, `interview_answers`, `community_groups`,
   `community_memberships`, `community_posts`, `community_comments`,
   `community_reactions` — and still see `checkpoints`, `checkpoint_blobs`,
   `checkpoint_writes`, `checkpoint_migrations` with their row counts
   unchanged from before.
3. `curl https://careeros-backend-17f9.onrender.com/health` → `{"status":"ok"}`.
4. End-to-end, against the live frontend or via `curl` with a real Clerk
   session token: create an Interview Preparation session
   (`POST /interview/sessions`), confirm a question comes back, submit an
   answer, and confirm a `community_groups` row can be created and joined.
   A real `INSERT` succeeding (not just a 200 on an empty-list `GET`) is
   the only real proof the migration applied — an empty list can't
   distinguish "table exists, no rows yet" from "table doesn't exist and
   the endpoint never actually queried it" if error handling is too
   permissive anywhere.

Once this checklist passes, update this document (or the root README) to
record the date and who ran it, and only then may Interview Preparation,
Video Interview, and Community be described as production-verified.
