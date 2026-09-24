# LAND STACK - Integrated GIS-Based Digital Land Governance Platform

A complete full-stack web application for digital land governance built with:
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + shadcn/ui
- **Maps**: MapLibre GL JS
- **Backend**: Python FastAPI
- **Database**: PostgreSQL + PostGIS
- **ORM**: SQLAlchemy + GeoAlchemy2
- **Authentication**: JWT + Role-Based Access Control (RBAC)

## Features
- Unified Land Parcel Identification Number (ULPIN) system
- Citizen portal for parcel search and service requests
- Officer dashboard for application processing and monitoring
- GIS mapping with parcel boundaries and spatial queries
- AI-powered change detection for anomaly alerts
- Role-based access control with JWT authentication
- Full audit trail for all critical actions
- Dockerized deployment

## Project Structure
```
LAND_STACK/
├── backend/                 # FastAPI backend
│   ├── app/                 # Application code
│   ├── alembic/             # Database migrations
│   ├── tests/               # Test suite
│   ├── Dockerfile           # Backend Dockerfile
│   ├── requirements.txt     # Python dependencies
│   └── alembic.ini          # Alembic configuration
├── frontend/                # React frontend
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── Dockerfile           # Frontend Dockerfile
│   ├── package.json         # NPM dependencies
│   └── vite.config.ts       # Vite configuration
├── docker-compose.yml       # Docker Compose orchestration
├── .env.example             # Environment variables template
└── seed_data.py             # Database seeding script
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.9+

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LAND_STACK
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Application**
   ```bash
   docker-compose up --build
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Setup (Without Docker)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed_data.py
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## User Roles
1. **Citizen** - Search parcels, submit service requests, track applications
2. **Government Officer** - Process applications, view analytics, investigate alerts
3. **Admin** - System administration, user management, oversee all operations

## API Documentation
Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Features Implemented
- [x] Authentication & Security (JWT, RBAC, password hashing)
- [x] Citizen Portal (parcel search, unified profile, service requests)
- [x] Officer Dashboard (analytics, pending applications, parcel explorer)
- [x] Spatial/GIS Core (PostGIS, MapLibre GL, GeoJSON endpoints)
- [x] AI + GIS Innovation (simulated change detection, anomaly alerts)
- [x] Core Engine (parcel management, workflow engine, audit logging)
- [x] Database seeding with sample data
- [x] Docker deployment ready
- [x] Role-based access control enforcement
- [x] Interactive map with parcel boundaries
- [x] Unified land profile view
- [x] Service request submission and tracking
- [x] Audit trail for all critical actions