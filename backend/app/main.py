"""Odin backend — FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import (
    admin,
    agent_config,
    auth,
    billing,
    chat,
    connectors,
    dashboard,
    memory,
    webhooks,
)
from app.config import settings
from app.utils.logger import get_logger, setup_logging
from app.utils.rate_limiter import limiter

setup_logging()
log = get_logger(__name__)

app = FastAPI(
    title="Odin — Personal AI Business Agent",
    version="1.0.0",
    docs_url="/docs",
)

# --- Rate limiting (slowapi) ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.environment}


@app.get("/")
async def root():
    return {"service": "odin", "docs": "/docs"}


# --- Routers ---
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(chat.router)
app.include_router(memory.router)
app.include_router(connectors.router)
app.include_router(agent_config.router)
app.include_router(billing.router)
app.include_router(admin.router)
app.include_router(webhooks.router)
