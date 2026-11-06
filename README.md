# SHIFTShield 2.0

### Workforce Safety & Risk Monitoring Platform

🚀 **[OPEN LIVE APPLICATION](https://shift-shield-blue.vercel.app)**

---

# SHIFTShield 2.0

**Occupational Heat Safety & Adaptive Workforce Intelligence Platform**

> Don't just predict the heat. Protect the people working in it.

SHIFTShield 2.0 is an occupational heat-safety and workforce decision-support prototype designed to help supervisors monitor outdoor worker conditions, assess estimated heat-exposure concerns, coordinate tasks, and respond to safety incidents.

The platform combines environmental information, workload, task duration, and worker status to provide explainable risk assessments and actionable safety recommendations.

## Problem Statement

Outdoor workers can face significant heat-exposure risks, particularly when environmental conditions combine with physically demanding work and prolonged exposure.

SHIFTShield aims to support workplace safety decisions by bringing worker monitoring, estimated heat-risk assessment, task scheduling, cooling resources, and emergency alerts into one platform.

## Key Features

- **Supervisor Dashboard:** Workforce overview, safety indicators, alerts, and activity summaries.
- **Heat Risk Assessment:** Explainable, rule-based assessment using temperature, humidity, workload, environment, duration, and acclimatisation inputs.
- **Workforce Monitoring:** Worker status and task information.
- **Smart Scheduler:** Task scheduling with recovery periods and safety conflict indicators.
- **Cooling Resource Map:** Displays water, shade, and first-aid resources.
- **Emergency Centre:** Worker SOS requests and supervisor response workflow.
- **Worker Mobile Interface:** Worker tasks, safety status, nearby resources, and emergency assistance requests.
- **Safety Analytics:** Charts, activity summaries, and safety action records.
- **Demo Scenarios:** Four demonstration scenarios for different workplace conditions.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| UI and Charts | Lucide, Recharts |
| Maps | Leaflet, React-Leaflet, OpenStreetMap |
| State Management | Zustand, TanStack React Query |
| Backend | Python, FastAPI, Pydantic |
| Database and Authentication | Supabase, PostgreSQL, Supabase Auth |
| Weather Integration | Open-Meteo API |
| Development Assistance | IBM Bob, Visual Studio Code |

## System Architecture

```text
                 SUPERVISOR / WORKER
                         |
                         v
              REACT + TYPESCRIPT
                  FRONTEND
                         |
                         v
                  FASTAPI BACKEND
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
         RISK ENGINE  SCHEDULER   ALERTS
             |           |           |
             +-----------+-----------+
                         |
                         v
                DATA / APPLICATION
                     SERVICES
                         |
               +---------+---------+
               |                   |
               v                   v
          DEMO MODE          SUPABASE MODE
       Simulated data       PostgreSQL + Auth

       External integrations:
       Open-Meteo — Weather information
       OpenStreetMap — Map tiles
```

The application supports a demonstration configuration using fixture data and a separately configurable Supabase integration.

## IBM Bob and Development Process

IBM Bob was used as an AI-assisted development tool during the development of SHIFTShield 2.0.

It supported the development workflow through assistance with:

- Project scaffolding and implementation.
- Frontend and backend code development.
- Debugging and troubleshooting.
- Iterative refinement of application features.
- Technical implementation and integration support.

The project was developed through an iterative workflow involving IBM Bob and Visual Studio Code.

## Running in Demo Mode

SHIFTShield supports a demonstration mode that does not require external Supabase credentials.

Demo configuration:

**Frontend — `frontend/.env.local`**

```env
VITE_DEMO_MODE=true
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Backend — `backend/.env`**

```env
DEMO_MODE=true
```

The application uses built-in demonstration data when configured for demo mode.

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- Python 3.11 or later
- Git

## Installation and Setup

### 1. Navigate to the project

```bash
cd shiftshield
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

Create `frontend/.env.local` using the example configuration:

```env
VITE_DEMO_MODE=true
VITE_API_URL=http://localhost:8000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 3. Install backend dependencies

Return to the project root and enter the backend folder:

```bash
cd ..
cd backend
```

Create and activate a virtual environment.

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DEMO_MODE=true
```

### 4. Start the backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend API documentation:

http://localhost:8000/docs

### 5. Start the frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd shiftshield/frontend
npm run dev
```

Application:

http://localhost:5173

Keep both development servers running while using the application.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Supervisor | supervisor@shiftshield.demo | ShiftShield2026! |
| Worker | worker01@shiftshield.demo | ShiftShield2026! |

Use the Demo Login buttons on the login screen for one-click access.

**Important:** These are demonstration credentials only. Do not reuse them for real accounts or production deployments.

## External Integrations

### Open-Meteo

SHIFTShield is designed to retrieve weather information through the Open-Meteo API.

Public endpoint:

https://api.open-meteo.com/v1/forecast

The free non-commercial endpoint does not require an API key. Weather integration is separate from the simulated weather data used in demo mode.

### OpenStreetMap

Leaflet and OpenStreetMap provide map functionality for displaying cooling resources and workplace locations.

## Supabase Configuration

The repository includes SQL files for configuring the Supabase database:

- `supabase/schema.sql` — database schema.
- `supabase/policies.sql` — row-level security policies.
- `supabase/seed.sql` — demonstration data.
- `supabase/SETUP.md` — setup instructions.

Supabase credentials should be configured through local environment variables. Service-role keys and JWT secrets must remain backend-only and must never be committed to the repository.

## Project Limitations

- Heat-risk assessments use deterministic, rule-based scoring. They are not machine-learning predictions.
- Risk assessments represent estimated heat-exposure concerns and are not medically validated WBGT measurements.
- Demo mode uses simulated worker and environmental data.
- The platform is a prototype for demonstration and decision support, not a replacement for professional occupational health and safety procedures.
- Emergency alerts notify the configured application workflow; they do not directly contact emergency services.

## Project Structure

```text
SHIFTShield-2.0/
├── frontend/
├── backend/
├── supabase/
│   ├── schema.sql
│   ├── policies.sql
│   ├── seed.sql
│   └── SETUP.md
├── docs/
├── .env.example
├── .gitignore
├── README.md
└── shiftshield-plan.md
```

## Hackathon Context

SHIFTShield 2.0 is being developed as part of a hackathon workflow that incorporates IBM Bob into the development process.

The repository documents the implementation, technical architecture, development approach, and demonstration capabilities of the prototype.
