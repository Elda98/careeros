from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import ai_career_center, dashboard, health, notifications, profiles, settings

app = FastAPI(
    title="CareerOS API",
    description=(
        "Presentation <-> Interaction contract surface (SAS Part II §9) for the "
        "AI Career Center module (SAS Part III §14)."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
