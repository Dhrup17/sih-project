# LAND STACK - Integrated GIS-Based Digital Land Governance Platform

A complete full-stack web application for digital land governance with spatial data management, built with modern technologies.

![LAND STACK Banner](https://via.placeholder.com/1200x300/0a0f1e/00d4ff?text=LAND+STACK+-+Digital+Land+Governance+Platform)

## 🌟 Features

### Core Capabilities
- **Unified Land Parcel Identification (ULPIN)** - Every parcel has a single immutable digital identity
- **Parcel-Centric Architecture** - One ULPIN connects ownership, registration, taxation, utilities, encumbrances, and spatial geometry
- **Unified Land Profile** - Real-time fusion of spatial and textual data for each parcel
- **Interactive GIS Mapping** - MapLibre GL-powered maps with parcel boundaries and spatial queries
- **Role-Based Access Control** - Citizen, Officer, and Admin roles with granular permissions
- **AI-Powered Anomaly Detection** - Simulated change detection for land use violations

### User Portals

#### 🏠 Citizen Portal
- Search parcels by ULPIN or Survey Number
- View interactive GIS maps with parcel boundaries
- Access Unified Land Profile with complete parcel history
- Submit service requests (Ownership Transfer, Land Use Change, Mutation, Construction Permission)
- Track application status in real-time with timeline view
- Download documents and records

#### 👨💼 Officer/Admin Dashboard
- **Command Center Analytics**
  - AI Anomaly Alerts count
  - Open Disputes tracker
  - Pending Approvals with average wait time
  - Application statistics
- **Application Processing**
  - Review, approve, or reject applications
  - View full parcel context during review
  - Add comments and update status
  - Automated restriction checks
- **Unified Parcel Explorer**
  - Search any parcel
  - View complete history and related records
  - Generate reports
  - Compare records across time
- **Anomaly Investigation**
  - Review AI-detected changes
  - View before/after imagery
  - Mark as resolved or false positive
  - Link to enforcement actions

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI primitives
- **Maps**: MapLibre GL JS
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Backend
- **Framework**: Python FastAPI
- **ORM**: SQLAlchemy 2.0 + GeoAlchemy2
- **Database**: PostgreSQL 15 + PostGIS 3.3 (production) / SQLite (local dev fallback)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt password hashing, RBAC
- **API Documentation**: OpenAPI/Swagger (auto-generated)
- **Validation**: Pydantic v2

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: Alembic
- **Reverse Proxy**: Nginx (for frontend)

## 📋 Prerequisites

- **Docker** and **Docker Compose** (recommended)
  
  OR for local development:
- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 15+ with PostGIS extension

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   cd LAND_STACK
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for Docker setup)
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Database**: localhost:5432

5. **Login credentials** (seeded automatically)
   ```
   Citizen:  citizen1@landstack.gov.in  / password123
   Officer:  officer1@landstack.gov.in  / password123
   Admin:    admin@landstack.gov.in     / password123
   ```

The database will be automatically seeded with 20 sample parcels, users, applications, and anomaly alerts.

## 🔧 Local Development Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL with PostGIS**
   ```bash
   # Install PostgreSQL and PostGIS extension
   # Create database
   createdb landstack_db
   psql -d landstack_db -c "CREATE EXTENSION postgis;"
   ```

5. **Configure environment**
   ```bash
   cp ../.env.example .env
   # Edit DATABASE_URL if needed
   ```

6. **Initialize database and seed data**
   ```bash
   python seed_data.py
   ```

7. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API will be available at http://localhost:8000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Ensure VITE_API_URL=http://localhost:8000/api/v1
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at http://localhost:5173

## 📁 Project Structure

```
LAND_STACK/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   └── v1/
│   │   │       ├── endpoints/ # Route handlers
│   │   │       └── api.py     # Router aggregation
│   │   ├── core/              # Core functionality
│   │   │   ├── config.py      # Configuration
│   │   │   ├── security.py    # Auth & security
│   │   │   └── deps.py        # Dependencies
│   │   ├── db/                # Database
│   │   │   ├── base.py        # SQLAlchemy base
│   │   │   ├── session.py     # DB session
│   │   │   └── init_db.py     # DB initialization
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── parcel.py
│   │   │   ├── applications.py
│   │   │   └── ...
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── parcel.py
│   │   │   └── ...
│   │   └── main.py            # FastAPI app
│   ├── seed_data.py           # Database seeding
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── layout/       # Layout components
│   │   │   └── maps/         # Map components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   ├── lib/              # Utilities
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json          # NPM dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── nginx.conf            # Nginx configuration
│   └── Dockerfile
├── docker-compose.yml        # Docker orchestration
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts with role-based access
- **parcels** - Land parcels with ULPIN and geometry (GeoJSON string)
- **ownership_ror** - Record of Rights (ownership records)
- **registrations** - Registration transactions
- **tax_records** - Property tax assessments and payments
- **encumbrances** - Mortgages, liens, and restrictions
- **applications** - Service requests and approvals
- **application_status_history** - Immutable audit trail
- **anomalies** - AI-detected land use changes
- **documents** - Document metadata and references

### Spatial Features
- Parcel boundaries stored as GeoJSON `Polygon` strings (SRID 4326)
- When using PostgreSQL + PostGIS, geometries are stored as native `GEOMETRY(POLYGON, 4326)` columns with spatial indexing
- Spatial operations (`ST_Contains`, `ST_Intersects`, `ST_Buffer`, `ST_Area`) are available when running with PostGIS

## 🔐 Security Features

- **JWT-based authentication** with bcrypt password hashing
- **Role-based access control** (RBAC) with three roles: Citizen, Officer, Admin
- **Protected API endpoints** with dependency injection
- **CORS configuration** for secure cross-origin requests
- **Immutable audit trail** for all critical actions
- **SQL injection protection** via SQLAlchemy ORM
- **Input validation** using Pydantic schemas

## 🎨 UI/UX Design

- **Dark theme** with deep navy background (#0a0f1e) and cyan accents (#00d4ff)
- **Professional government dashboard** aesthetic
- **Responsive design** that works on desktop, tablet, and mobile
- **Loading states** and **error handling** throughout
- **Toast notifications** for user feedback
- **Interactive maps** as hero elements on parcel views
- **Clean typography** and spacing using Tailwind CSS

## 📊 Sample Data

The seed script creates realistic test data:
- **20 parcels** near Lucknow, UP with actual geographic coordinates
- **10 users** across all three roles (3 Citizens, 3 Officers, 3 Admins, 1 System Admin)
- **15 applications** in various statuses (Submitted, Under Review, Approved, Rejected)
- **5 AI anomaly alerts** linked to specific parcels
- **Ownership records** with single and joint ownership scenarios
- **Tax records** for 2023 and 2024 with varied payment statuses
- **Registrations** with transaction history
- **Encumbrances** (mortgages, court stays, liens)
- **Documents** linked to parcels

All parcels are positioned around Lucknow District HQ (26.8467° N, 80.9462° E).

## 🧪 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

### Parcels
- `GET /api/v1/parcels/` - List all parcels (with search/filter)
- `GET /api/v1/parcels/geojson` - Get all parcels as GeoJSON
- `GET /api/v1/parcels/{ulpin}` - Get unified parcel profile
- `GET /api/v1/parcels/{ulpin}/geojson` - Get parcel geometry

### Applications
- `POST /api/v1/applications/` - Submit new application
- `GET /api/v1/applications/` - List applications (filtered by user role)
- `GET /api/v1/applications/{id}` - Get application details
- `PUT /api/v1/applications/{id}/status` - Update application status (Officers only)

### Anomalies
- `GET /api/v1/anomalies/` - List anomaly alerts (Officers only)
- `GET /api/v1/anomalies/{id}` - Get anomaly details
- `POST /api/v1/anomalies/` - Create anomaly alert
- `PUT /api/v1/anomalies/{id}/status` - Update anomaly status
- `POST /api/v1/anomalies/detect` - Run simulated change detection on parcel

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics (Officers only)

### Users
- `GET /api/v1/users/` - List all users (Admin only)
- `GET /api/v1/users/{id}` - Get user by ID

Full API documentation is available at http://localhost:8000/docs when the backend is running.

## 🤖 AI/ML Features

### Change Detection Module
The platform includes a **simulated AI change detection** system that:
- Analyzes land use changes from "satellite imagery"
- Detects unauthorized construction
- Identifies boundary encroachments
- Flags vegetation loss and deforestation
- Generates confidence scores (0.0 to 1.0)
- Creates anomaly alerts linked to specific ULPINs
- Pushes alerts to Officer Dashboard

Officers can:
- Review anomaly details with before/after context
- Investigate flagged parcels
- Update status (New → Under Investigation → Resolved/False Positive)
- Take enforcement actions

The current implementation is a simulation using random data, but the architecture is ready for integration with real computer vision models (scikit-learn, TensorFlow, PyTorch).

## 🌐 GIS Integration

### PostGIS Spatial Database (when configured)
- When `SQLALCHEMY_DATABASE_URI` points to a PostgreSQL+PostGIS database, parcel geometries are stored as native `GEOMETRY(POLYGON, 4326)` (WGS84 projection)
- Supports spatial queries: `ST_Contains`, `ST_Intersects`, `ST_Buffer`, `ST_Area`
- Spatial indexing for performance
- GeoJSON serialization for web delivery

> **Note:** The default local setup uses SQLite with GeoJSON string geometry. To enable full PostGIS spatial features, set `SQLALCHEMY_DATABASE_URI=postgresql://...` in your `.env` and run with Docker Compose (which includes a PostGIS container).

### MapLibre GL Maps
- Interactive vector tile maps
- Parcel boundary rendering with fill and stroke
- Click-to-select functionality
- Popup information windows
- Automatic bounds fitting
- Zoom controls and navigation
- OpenStreetMap base layer

### Spatial Queries (Ready for Implementation)
- Find parcels within polygon
- Identify neighboring parcels
- Calculate distances
- Buffer zones around features
- Overlay analysis

## 📝 Acceptance Criteria Status

✅ **All features implemented and working:**

1. ✅ Citizen can search parcel → see map + profile → submit request → track status
2. ✅ Officer can log in → see pending applications & AI alerts → process applications → updates appear in audit log
3. ✅ Map correctly shows parcel boundaries and is interactive
4. ✅ Role-based access is enforced on all endpoints
5. ✅ Change detection can create anomaly alerts linked to ULPINs
6. ✅ All data is consistent via ULPIN relationships
7. ✅ Full audit trail with immutable status history
8. ✅ JWT authentication with password hashing
9. ✅ Dockerized deployment ready
10. ✅ Comprehensive seed data with realistic Indian context

## 🐛 Troubleshooting

### Docker Issues

**Problem**: `backend` service fails to start
```bash
# Check logs
docker-compose logs backend

# Common fix: Restart services
docker-compose down
docker-compose up --build
```

**Problem**: Database connection errors
```bash
# Ensure PostgreSQL is healthy
docker-compose ps

# Restart only the database
docker-compose restart postgres
```

### Local Development Issues

**Backend: Module not found errors**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Frontend: Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**PostGIS extension not found**
```sql
-- Connect to database and enable PostGIS
psql -d landstack_db
CREATE EXTENSION postgis;
```

## 🚢 Production Deployment

### Environment Variables
For production, update `.env` with:
- Strong `SECRET_KEY` (use `openssl rand -hex 32`)
- Production database credentials
- HTTPS origins in `BACKEND_CORS_ORIGINS`
- Secure password policies

### Database Backups
```bash
# Backup
docker exec landstack_postgres pg_dump -U landstack landstack_db > backup.sql

# Restore
docker exec -i landstack_postgres psql -U landstack landstack_db < backup.sql
```

### Nginx Configuration
For production, configure Nginx with:
- HTTPS/SSL certificates (Let's Encrypt)
- Reverse proxy to backend
- Static file caching
- Compression (gzip)

## 🤝 Contributing

This is a demonstration project for the Smart India Hackathon 2024. For a production deployment:
1. Add comprehensive error handling
2. Implement rate limiting
3. Add request logging and monitoring
4. Set up CI/CD pipelines
5. Add integration and e2e tests
6. Implement real computer vision models
7. Add multi-language support
8. Implement advanced spatial queries

## 📄 License

This project is part of the Smart India Hackathon 2024 submission.

## 👥 Team

Built for digital transformation of land governance in India.

## 📞 Support

For issues and questions:
- Check the `/docs` endpoint for API documentation
- Review logs: `docker-compose logs`
- Verify database connection and PostGIS installation

---

**Built with ❤️ for Smart India Hackathon 2024** 🇮🇳