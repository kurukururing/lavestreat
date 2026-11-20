import os

from fastapi import FastAPI

from app.routers import health

# /docs hanya aktif bila DOCS_ENABLED=true (PRD 13.4).
_docs = os.getenv("DOCS_ENABLED", "false").lower() == "true"

app = FastAPI(
    title="LAVE STREAT AI",
    docs_url="/docs" if _docs else None,
    redoc_url=None,
    openapi_url="/openapi.json" if _docs else None,
)

app.include_router(health.router)
