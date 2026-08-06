from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import ai_career_center, dashboard, health, notifications, profiles, settings
from app.core.config import get_settings

app = FastAPI(
    title="CareerOS API",
    description=(
        "Presentation <-> Interaction contract surface (SAS Part II §9) for the "
        "AI Career Center module (SAS Part III §14)."
    ),
    version="0.1.0",
)

# CORS_ALLOWED_ORIGINS (comma-separated) — defaults to the local dev
# frontend only; production deployments must set it to their real
# origin(s) (e.g. the Vercel frontend URL). See the deployment checklist
# in the root README.
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(profiles.router)
app.include_router(ai_career_center.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(settings.router)
