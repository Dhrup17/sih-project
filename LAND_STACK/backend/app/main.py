import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure static folders exist on startup
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    os.makedirs(os.path.join(static_dir, "satellite_imagery"), exist_ok=True)
    os.makedirs(os.path.join(static_dir, "heatmaps"), exist_ok=True)
    # Initialize database tables
    from app.db.init_db import init_db
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Integrated GIS-Based Digital Land Governance Platform with AI Land Monitoring & Real-time GPS Navigation",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static folders exist and mount them
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "satellite_imagery"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "heatmaps"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to LAND STACK GIS Platform API",
        "version": "2.0.0",
        "docs": "/docs",
        "spatial_features": ["PostGIS", "AI Land Monitoring", "Real-time GPS Tracking", "Live WebSockets"]
    }
