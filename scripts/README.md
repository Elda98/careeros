# scripts

Developer-workflow scripts. Prefer `make <target>` (see the root `Makefile`) for anything Docker-based; scripts here are for native (non-container) setup.

- `setup.sh` — one-time bootstrap: creates `.env`, sets up Python virtualenvs for `ai/` and `backend/`, installs frontend dependencies.
