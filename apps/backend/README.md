# AI Tech Marketplace — FastAPI Backend

Production-grade asynchronous backend service for the **AI-Powered Multi-Vendor Technology Marketplace**, built with FastAPI, SQLAlchemy 2.x async, PostgreSQL, Alembic, Pydantic v2, and secure JWT/cookie authentication.

---

## 1. Architecture Overview

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database ORM**: [SQLAlchemy 2.x Async](https://docs.sqlalchemy.org/en/20/) with `asyncpg` driver
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/) (Async environment)
- **Security & Cryptography**: Direct `bcrypt` password hashing + `PyJWT` cryptographically signed access tokens
- **Session Transport**: HTTP-only Cookies (`auth_token`) + Bearer token fallback
- **Role-Based Access Control (RBAC)**: `CUSTOMER`, `AGENT`, `ADMIN` with two-tier vendor validation (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`)
- **Configuration**: `pydantic-settings` reading from `.env`
- **Testing**: `pytest` + `pytest-asyncio` + `httpx` (21 passing automated tests)

```text
apps/backend/
├── app/
│   ├── main.py                  # FastAPI app factory, lifespan, CORS, and exception handling
│   ├── api/
│   │   ├── deps.py              # Dependencies: get_current_user, require_role, require_approved_agent
│   │   ├── router.py            # API root router mounting /v1
│   │   └── v1/
│   │       ├── router.py        # v1 router mounting /auth, /users, /admin, /health
│   │       └── endpoints/
│   │           ├── auth.py      # /register, /register-agent, /login, /me, /logout
│   │           ├── admin.py     # /admin/agents, /admin/agents/{id}/status, /admin/overview
│   │           ├── users.py     # /users/me
│   │           └── health.py    # Health & DB connectivity check endpoints
│   ├── core/
│   │   ├── config.py            # Settings with DB URL normalization, JWT & Cookie configs
│   │   ├── security.py          # bcrypt password hashing & PyJWT token utilities
│   │   ├── logging.py           # Structured logging configuration
│   │   └── exceptions.py        # Domain exceptions & uniform JSON error handlers
│   ├── db/
│   │   ├── base.py              # DeclarativeBase, TimestampMixin, UUIDPrimaryKeyMixin
│   │   ├── session.py           # AsyncEngine, async_sessionmaker, and get_db dependency
│   │   └── models/
│   │       ├── user.py          # User model (UUID, email, phone, role, password_hash)
│   │       └── agent.py         # Agent model (shop_name, slug, verification, status)
│   ├── schemas/
│   │   ├── auth.py              # Register, Login, CurrentUser, and Auth schemas
│   │   ├── user.py              # UserSummary schemas
│   │   ├── agent.py             # AgentProfileResponse, AdminReviewAgentRequest
│   │   └── response.py          # StandardApiResponse envelope
│   ├── scripts/
│   │   ├── create_admin.py      # CLI script for secure Super Admin account management
│   │   └── seed_dev_data.py     # Development database seeder for demo accounts
│   └── utils/
│       └── slug.py              # Safe URL slug generator with collision resolution
├── alembic/                     # Async migration environment
│   ├── versions/                # Migration revisions
│   ├── env.py                   # Async migration runner wired to application settings
│   └── script.py.mako
├── tests/                       # Automated test suite (21 automated tests)
│   ├── conftest.py              # Async HTTP client fixture & DB engine cleanup
│   ├── test_auth.py             # Registration, login, invalid credentials, /me, logout
│   ├── test_rbac.py             # Role enforcement, agent approval lifecycle, transition guards
│   └── test_health.py           # System & DB health endpoint tests
├── alembic.ini                  # Alembic CLI configuration
├── requirements.txt             # Pinned core and development dependencies
├── .env.example                 # Configuration template with Phase 2 auth variables
└── README.md                    # Setup documentation
```

---

## 2. Local Setup Guide (Windows / PowerShell)

### Prerequisites
- Python 3.10+ (Verified on Python 3.14.5 64-bit)
- PostgreSQL database instance (Neon PostgreSQL cloud or local)

### Step 1: Create and Activate Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and configure credentials:
```powershell
Copy-Item .env.example .env
```
Key configuration settings:
```ini
DATABASE_URL=postgresql+asyncpg://<username>:<password>@<host>/<database>
JWT_SECRET_KEY=dev-marketplace-jwt-secret-key-saad-phase2-9f8e7d6c5b4a
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
AUTH_COOKIE_NAME=auth_token
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### Step 4: Run Database Migrations
Apply all schema revisions to the PostgreSQL database:
```powershell
alembic upgrade head
```

### Step 5: Seed Development Demo Accounts
To seed standard demo accounts (Admin, Approved Agent, Pending Agent, Customer):
```powershell
python -m app.scripts.seed_dev_data
```
Default credentials:
- **Super Admin**: `admin@techmarketplace.pk` / `Admin123!`
- **Approved Agent**: `lahore@techzone.pk` / `Admin123!`
- **Pending Agent**: `pending@karachitech.pk` / `Admin123!`
- **Customer**: `customer@gmail.com` / `Admin123!`

### Step 6: Create or Elevate a Super Admin via CLI
```powershell
python -m app.scripts.create_admin --email admin@example.com --name "System Admin"
```
*(Prompts securely for password if omitted)*

### Step 7: Run the FastAPI Server
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **System Health**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- **Database Health**: [http://127.0.0.1:8000/api/v1/health/db](http://127.0.0.1:8000/api/v1/health/db)

---

## 3. Running Automated Tests

Run the complete test suite:
```powershell
pytest -v
```

All 21 automated tests pass cleanly:
- **Authentication Suite** (`tests/test_auth.py`):
  - Customer registration with validation
  - Duplicate email collision rejection (HTTP 409)
  - Invalid payload rejection (HTTP 422)
  - Successful login with JWT and HTTP-only cookie
  - Wrong password rejection (HTTP 401)
  - Unknown account rejection (HTTP 401)
  - `/me` session restoration via HTTP-only cookie
  - `/me` session restoration via Bearer header
  - Unauthenticated access rejection (HTTP 401)
  - Logout clearing session cookie
- **RBAC & Agent Lifecycle Suite** (`tests/test_rbac.py`):
  - Customer forbidden from Admin endpoints (HTTP 403)
  - Customer forbidden from Agent endpoints (HTTP 403)
  - Agent forbidden from Admin endpoints (HTTP 403)
  - Admin access to Admin endpoints (HTTP 200)
  - Agent registration creating `PENDING` status atomically
  - Pending Agent denied from approved-seller actions
  - Admin reviewing and granting `APPROVED` status
  - Approved Agent permitted to access seller endpoints
  - Non-admin blocked from modifying Agent status
  - Invalid status lifecycle transitions rejected (HTTP 400)
- **System & Health Suite** (`tests/test_health.py`):
  - Root `/health`, versioned `/api/v1/health`, database `/api/v1/health/db` ping latency

---

## 4. Phase 2 Endpoints Summary

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Customer registration; returns user & sets cookie |
| `POST` | `/api/v1/auth/register-agent` | Public | Atomically registers Agent user + shop profile with `PENDING` status |
| `POST` | `/api/v1/auth/login` | Public | Authenticates user; returns token & sets cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns current authenticated user and Agent profile |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clears `auth_token` cookie |

### Users (`/api/v1/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Authenticated | Current user profile |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/agents` | ADMIN | Lists all registered Agent vendor applications |
| `PATCH` | `/api/v1/admin/agents/{id}/status` | ADMIN | Approves, rejects, or suspends Agent status |
| `GET` | `/api/v1/admin/overview` | ADMIN | Platform metrics (total users, total agents, pending agents) |
