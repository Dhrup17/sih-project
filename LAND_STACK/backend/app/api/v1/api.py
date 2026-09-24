from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    parcels,
    applications,
    anomalies,
    users,
    dashboard,
    ai_monitoring,
    gps_navigation,
    websocket,
    database
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(parcels.router, prefix="/parcels", tags=["Parcels"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["Anomalies"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(ai_monitoring.router, prefix="/ai", tags=["AI Land Monitoring"])
api_router.include_router(gps_navigation.router, prefix="/gps", tags=["GPS & Navigation"])
api_router.include_router(websocket.router, tags=["Live WebSockets"])
api_router.include_router(database.router, prefix="/database", tags=["Database & PostGIS"])
