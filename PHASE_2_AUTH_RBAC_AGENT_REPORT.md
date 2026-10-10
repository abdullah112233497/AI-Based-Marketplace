# Phase 2 — Authentication, RBAC & Agent Foundation

**Author & Sole Implementer**: Muhammad Saad Raza  
**Project**: AI-Powered Multi-Vendor Technology Marketplace  
**Architecture Layer**: FastAPI Asynchronous Backend + Neon PostgreSQL + Next.js 14 Integration  
**Date**: October 9, 2026  

---

## 1. Phase Status
**Status: COMPLETE**

Phase 2 has been designed, implemented, migrated, integrated, and verified with 21 automated tests passing cleanly against the production Neon PostgreSQL database. All core objectives—customer registration, transactional agent vendor onboarding, secure bcrypt password hashing, signed JWT token issuance, HTTP-only cookie session handling, server-authoritative role-based access control (RBAC), admin agent verification, and hybrid frontend cutover—are fully operational.

---

## 2. Summary
Phase 2 establishes the core identity, authorization, and multi-vendor foundation for the marketplace. Built strictly within Phase 2 boundaries without bleeding into Phase 3 (products, catalog, cart, orders) or future phases:
1. **Production Database Persistence**: Added `users` and `agents` tables to the Neon PostgreSQL database via Alembic revision `d08c695be889_create_users_and_agents_tables.py`.
2. **Security & Cryptography**: Replaced legacy prototype authentication with direct `bcrypt` hashing (cost factor 12) and `PyJWT` signed token generation (`HS256`).
3. **Session Management**: Implemented HTTP-only cookie authentication (`auth_token`) with SameSite (`lax`) and configurable HTTPS transport flags, backed by Bearer authorization header support.
4. **Agent Lifecycle Separation**: Strictly decoupled `UserRole.AGENT` from seller operational approval. All registered agents default to `AgentStatus.PENDING` until vetted by a Super Admin.
5. **Admin Control Center**: Built admin agent queue retrieval (`GET /api/v1/admin/agents`) and lifecycle review endpoints (`PATCH /api/v1/admin/agents/{agent_id}/status`) with state transition validation.
6. **Frontend Integration**: Implemented hybrid API cutover in `apps/web/src/lib/api.ts` such that all authentication, current user, and admin verification requests route directly to FastAPI, while existing catalog/cart mock features remain functional on Express.
7. **Automated Verification**: Created a 21-test automated suite covering registration, email conflict handling, credential validation, session restoration, RBAC isolation, and agent lifecycle transitions.

---

## 3. Architecture Decisions

| Decision | Selection | Rationale |
|---|---|---|
| **Identity Primary Key** | UUID (`UUIDPrimaryKeyMixin`) | Prevents sequential ID enumeration attacks across users and vendor stores while matching Phase 1 architecture. |
| **Password Hashing** | `bcrypt` (v5.0.0 directly) | Avoids Python 3.14 compatibility issues observed in older wrappers (`passlib`) while guaranteeing constant-time verification and secure salted hashes. |
| **Session Delivery** | HTTP-only Cookies + Bearer Header | Primary web client uses HTTP-only cookies to eliminate XSS token theft risks; Bearer header is supported for testing, mobile apps, and programmatic API access. |
| **Agent / Shop Storage** | Separate `agents` Entity (1-to-1) | Prevents user table pollution with dozens of nullable shop columns; enables independent lifecycle state tracking. |
| **Slug Collisions** | Algorithmic Numeric Suffixes | Auto-generates clean slugs from shop names and appends `-2`, `-3` etc. to eliminate database constraint failures. |
| **Hybrid Migration Strategy** | Dual-Target Route Resolution | Routes auth and admin endpoints to FastAPI on port 8000 while keeping non-migrated mock features on Express port 5000, preventing frontend breakage. |

---

## 4. Database Models Added

### `User` (`app.db.models.user.User`)
Table: `users`
- `id` (UUID, Primary Key, auto-generated `uuid4`)
- `name` (String 255, nullable=False)
- `email` (String 255, unique=True, index=True, normalized lowercase)
- `phone` (String 50, nullable=True)
- `password_hash` (String 255, nullable=False)
- `role` (Enum `UserRole`: `CUSTOMER`, `AGENT`, `ADMIN`, nullable=False, default=`CUSTOMER`, index=True)
- `is_active` (Boolean, default=True, nullable=False)
- `is_verified` (Boolean, default=False, nullable=False)
- `created_at` / `updated_at` (DateTime with timezone, server default `now()`)
- Relationship: `agent` (One-to-one with `Agent`, cascade="all, delete-orphan", lazy="selectin")

### `Agent` (`app.db.models.agent.Agent`)
Table: `agents`
- `id` (UUID, Primary Key, auto-generated `uuid4`)
- `user_id` (UUID, Foreign Key `users.id` with `ondelete='CASCADE'`, unique=True, index=True)
- `shop_name` (String 255, nullable=False)
- `shop_slug` (String 255, unique=True, index=True, nullable=False)
- `shop_description` (String 1000, nullable=True)
- `city` (String 100, nullable=False)
- `address` (String 500, nullable=False)
- `contact_phone` (String 50, nullable=False)
- `cnic_or_tax_id` (String 100, nullable=True)
- `status` (Enum `AgentStatus`: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, default=`PENDING`, index=True)
- `is_verified` (Boolean, default=False, nullable=False)
- `rating` (Float, default=5.0, nullable=False)
- `rating_count` (Integer, default=0, nullable=False)
- `product_count` (Integer, default=0, nullable=False)
- `created_at` / `updated_at` (DateTime with timezone, server default `now()`)
- Relationship: `user` (Reverse relationship to `User`)

---

## 5. Alembic Migration

- **Migration File**: `apps/backend/alembic/versions/d08c695be889_create_users_and_agents_tables.py`
- **Revision ID**: `d08c695be889`
- **Revises**: `129072c708c8` (Phase 1 Foundation)
- **Status**: Successfully applied to Neon PostgreSQL (`alembic upgrade head`).
- **Tables Created**: `users`, `agents`.
- **Indexes Created**:
  - `ix_users_email` (unique)
  - `ix_users_email_lower`
  - `ix_users_role`
  - `ix_agents_user_id` (unique)
  - `ix_agents_shop_slug` (unique)
  - `ix_agents_status`

---

## 6. Authentication Flow

```text
┌────────────────────────────────────────────────────────┐
│                   Customer Registration                │
└────────────────────────────────────────────────────────┘
POST /api/v1/auth/register
  ├── 1. Validate Pydantic schema (Name, EmailStr, Phone regex, Password >= 8)
  ├── 2. Lowercase and normalize email
  ├── 3. Query PostgreSQL for duplicate email (raises 409 EMAIL_EXISTS if found)
  ├── 4. Generate bcrypt hash (12 salt rounds)
  ├── 5. Insert User (role = CUSTOMER, is_active = True)
  ├── 6. Issue signed JWT (sub = user.id, role = CUSTOMER, exp = 7 days)
  ├── 7. Set HTTP-only Cookie: auth_token=<jwt>; HttpOnly; SameSite=Lax; Path=/
  └── 8. Return HTTP 201 Created with safe UserSummary

┌────────────────────────────────────────────────────────┐
│               Vendor / Agent Registration              │
└────────────────────────────────────────────────────────┘
POST /api/v1/auth/register-agent
  ├── 1. Validate schema (Owner name, Email, Phone, Password, Shop details, City, CNIC)
  ├── 2. Duplicate email check
  ├── 3. Generate collision-free shop slug via generate_unique_shop_slug()
  ├── 4. Begin atomic DB transaction:
  │       ├── Create User (role = AGENT, is_active = True)
  │       ├── Flush to retrieve User UUID
  │       └── Create Agent (user_id = user.id, status = PENDING, is_verified = False)
  ├── 5. Commit transaction atomically (Rollback if any step fails)
  ├── 6. Issue signed JWT and set HTTP-only cookie
  └── 7. Return HTTP 201 Created with UserSummary containing AgentProfile (status: PENDING)

┌────────────────────────────────────────────────────────┐
│                      User Login                        │
└────────────────────────────────────────────────────────┘
POST /api/v1/auth/login
  ├── 1. Normalize email
  ├── 2. Fetch User with selectinload(User.agent)
  ├── 3. Constant-time bcrypt.checkpw verification
  │       └── Generic 401 INVALID_CREDENTIALS error on mismatch (prevents account enumeration)
  ├── 4. Verify user.is_active is True (raises 403 ACCOUNT_INACTIVE if deactivated)
  ├── 5. Issue signed JWT and set HTTP-only cookie
  └── 6. Return HTTP 200 OK with UserSummary + AgentProfile
```

---

## 7. JWT & Cookie Strategy

### Token Claims
```json
{
  "sub": "<uuid-string>",
  "role": "CUSTOMER | AGENT | ADMIN",
  "iat": 1791561075,
  "exp": 1792165875
}
```
- No plaintext passwords, sensitive PII, or internal tokens are placed inside the JWT.
- Configured via `JWT_SECRET_KEY`, `JWT_ALGORITHM` (`HS256`), and `ACCESS_TOKEN_EXPIRE_MINUTES` (`10080` = 7 days).

### Cookie Configuration
- **Cookie Name**: `auth_token`
- **HttpOnly**: `True` (guarantees protection against JavaScript XSS exfiltration)
- **SameSite**: `lax` (prevents cross-site request forgery while preserving top-level redirects)
- **Secure**: Configurable (`False` for local development, `True` in production via `AUTH_COOKIE_SECURE`)
- **Path**: `/`
- **Max-Age**: `604,800` seconds (7 days)

---

## 8. RBAC Architecture

Authoritative server-side access control is enforced via modular FastAPI dependencies in `app/api/deps.py`:

```python
# 1. Base User Extraction & Session Validation
get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User

# 2. Role Restriction
require_role(*allowed_roles: UserRole) -> Callable
# Examples:
#   Depends(require_role(UserRole.ADMIN))
#   Depends(require_role(UserRole.AGENT))
#   Depends(require_role(UserRole.CUSTOMER, UserRole.AGENT))

# 3. Two-Tier Approved Vendor Enforcement
require_approved_agent(current_user: User = Depends(require_role(UserRole.AGENT, UserRole.ADMIN))) -> User
```

---

## 9. Agent Lifecycle

```text
       Agent Registration
               │
               ▼
       Account Created
  (User.role = AGENT)
               │
               ▼
  Shop Profile Created
(Agent.status = PENDING) ──► Restricted: Cannot publish listings
               │
       Super Admin Review
        ┌──────┴──────┐
        ▼             ▼
     APPROVED      REJECTED ──► Access Denied
        │             │
        │             └──► Admin Reconsideration ──► PENDING
        │
   Store Active
        │
   Admin Action
        │
        ▼
    SUSPENDED ◄──► Re-instated to APPROVED
```

---

## 10. Admin Approval Flow

### List Agent Applications
`GET /api/v1/admin/agents`
- Restricted to `UserRole.ADMIN`.
- Returns array of all registered agent shop profiles ordered by creation timestamp.

### Update Agent Status
`PATCH /api/v1/admin/agents/{agent_id}/status`
- Restricted to `UserRole.ADMIN`.
- Validates status transitions using `VALID_AGENT_STATUS_TRANSITIONS`:
  - `PENDING` $\rightarrow$ `APPROVED` or `REJECTED`
  - `APPROVED` $\rightarrow$ `SUSPENDED`
  - `SUSPENDED` $\rightarrow$ `APPROVED`
  - `REJECTED` $\rightarrow$ `PENDING`
- Attempts to perform invalid transitions (e.g. `PENDING` $\rightarrow$ `SUSPENDED`) return `HTTP 400 Bad Request` with `INVALID_AGENT_STATUS_TRANSITION`.
- Automatically marks `is_verified = True` upon transitioning to `APPROVED`.
- Logs audit event: `Admin <email> transitioned Agent <id> (<shop_name>) from <old_status> to <new_status>`.

---

## 11. API Endpoints Added

| HTTP Verb | Path | Auth Required | Permissions | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Public | Customer registration with welcome state |
| `POST` | `/api/v1/auth/register-agent` | None | Public | Transactional vendor application onboarding |
| `POST` | `/api/v1/auth/login` | None | Public | Authenticates credentials and sets session cookie |
| `GET` | `/api/v1/auth/me` | Yes | Any Active User | Returns current user profile and linked agent shop |
| `POST` | `/api/v1/auth/logout` | None | Public / Auth | Clears authentication cookie |
| `GET` | `/api/v1/users/me` | Yes | Any Active User | User profile retrieval endpoint |
| `GET` | `/api/v1/admin/agents` | Yes | `ADMIN` | Retrieves vendor application queue |
| `PATCH` | `/api/v1/admin/agents/{id}/status` | Yes | `ADMIN` | Updates agent approval status and verification |
| `GET` | `/api/v1/admin/overview` | Yes | `ADMIN` | Retrieves platform user and vendor counts |
| `GET` | `/api/v1/auth/test/customer-only` | Yes | `CUSTOMER` | RBAC test route for customer role |
| `GET` | `/api/v1/auth/test/agent-only` | Yes | `AGENT` | RBAC test route for agent role |
| `GET` | `/api/v1/auth/test/approved-agent-only` | Yes | `APPROVED AGENT` / `ADMIN` | RBAC test route for approved sellers |

---

## 12. Frontend Auth Integration

1. **Hybrid Cutover in `apps/web/src/lib/api.ts`**:
   Configured `resolveApiUrl()` to route auth and admin endpoints to FastAPI:
   - `/auth/*` $\rightarrow$ `http://localhost:8000/api/v1/auth/*`
   - `/users/*` $\rightarrow$ `http://localhost:8000/api/v1/users/*`
   - `/admin/agents*` $\rightarrow$ `http://localhost:8000/api/v1/admin/agents*`
   - `/admin/overview` $\rightarrow$ `http://localhost:8000/api/v1/admin/overview`
   - Remaining mock endpoints continue hitting Express prototype on `http://localhost:5000/api`.
2. **CORS & Cookie Transport**:
   `credentials: 'include'` in `apps/web/src/lib/api.ts` coupled with `allow_credentials=True` and `CORS_ORIGINS=["http://localhost:3000"]` on FastAPI ensures cookies are seamlessly accepted and returned.
3. **Navigation UX Middleware**:
   Created `apps/web/src/middleware.ts` to protect `/admin` and `/agent` client navigation from unauthenticated users, while relying on FastAPI for authoritative server-side protection.

---

## 13. Tests Added

A total of **21 automated tests** are active and passing:

### Authentication Tests (`apps/backend/tests/test_auth.py` — 10 tests)
1. `test_customer_registration_success`: Registers customer, validates 201 Created, token, and cookie.
2. `test_customer_registration_duplicate_email`: Rejects duplicate email with HTTP 409 `EMAIL_EXISTS`.
3. `test_customer_registration_invalid_payload`: Rejects malformed payload with HTTP 422 `VALIDATION_ERROR`.
4. `test_login_success`: Logs in, returns user profile, token, and sets `auth_token` cookie.
5. `test_login_wrong_password_rejected`: Rejects invalid password with generic HTTP 401 `INVALID_CREDENTIALS`.
6. `test_login_unknown_account_rejected`: Rejects unknown account with generic HTTP 401 `INVALID_CREDENTIALS`.
7. `test_me_authenticated_via_cookie`: Restores user session via HTTP-only cookie.
8. `test_me_authenticated_via_bearer_header`: Restores user session via Bearer header.
9. `test_me_unauthenticated_rejected`: Rejects unauthenticated request with HTTP 401 `UNAUTHORIZED`.
10. `test_logout_clears_cookie`: Calls logout and confirms cookie deletion.

### RBAC & Agent Lifecycle Tests (`apps/backend/tests/test_rbac.py` — 6 tests)
11. `test_customer_cannot_access_admin_endpoint`: Customer receives HTTP 403 `FORBIDDEN` on admin route.
12. `test_customer_cannot_access_agent_endpoint`: Customer receives HTTP 403 `FORBIDDEN` on agent route.
13. `test_agent_cannot_access_admin_endpoint`: Agent receives HTTP 403 `FORBIDDEN` on admin route.
14. `test_admin_can_access_admin_endpoint`: Admin successfully accesses `/api/v1/admin/agents`.
15. `test_agent_lifecycle_and_approval_flow`: Full end-to-end verification:
    - Registers Agent (status defaults to `PENDING`).
    - Pending Agent denied seller access (HTTP 403 `AGENT_NOT_APPROVED`).
    - Unauthorized Customer forbidden from approving Agent (HTTP 403 `FORBIDDEN`).
    - Super Admin reviews and sets status `APPROVED`.
    - Approved Agent granted access to seller endpoint (HTTP 200 OK).
16. `test_invalid_agent_status_transition_rejected`: Admin forbidden from illegal transitions (`PENDING` $\rightarrow$ `SUSPENDED`, HTTP 400).

### System & Health Tests (`apps/backend/tests/test_health.py` — 5 tests)
17. `test_health_root_endpoint`: Verifies `/health`.
18. `test_health_v1_endpoint`: Verifies `/api/v1/health`.
19. `test_database_health_endpoint`: Verifies Neon DB ping and query latency.
20. `test_docs_available`: Verifies Swagger `/docs`.
21. `test_not_found_error_envelope`: Verifies standard error envelope on 404.

---

## 14. Security Review

- **SQL Injection**: Prevented by parameterized SQLAlchemy 2.x async queries (`select(User).where(...)`).
- **Credential Storage**: Passwords hashed using bcrypt with salt rounds 12. Plaintext passwords never stored or returned.
- **Account Enumeration Defense**: Login returns generic `INVALID_CREDENTIALS` for both non-existent users and bad passwords.
- **Secret Management**: JWT secrets, database connection URLs, and cookie settings are managed through environment variables with safe defaults for local development.
- **Inactive Accounts**: Deactivated accounts (`is_active = False`) are blocked from authentication and JWT decoding.
- **CSRF & XSS Mitigation**: Authentication cookies use `HttpOnly=True` and `SameSite=lax`.
- **Sensitive Logging**: Passwords, raw tokens, and secret keys are excluded from application loggers.

---

## 15. Files Created

1. `apps/backend/app/db/models/user.py`: User model and `UserRole` enum.
2. `apps/backend/app/db/models/agent.py`: Agent model and `AgentStatus` enum.
3. `apps/backend/alembic/versions/d08c695be889_create_users_and_agents_tables.py`: Alembic migration for users & agents.
4. `apps/backend/app/core/security.py`: bcrypt hashing and PyJWT token generation/validation.
5. `apps/backend/app/schemas/agent.py`: Agent Pydantic response and review schemas.
6. `apps/backend/app/schemas/user.py`: UserSummary Pydantic response schema.
7. `apps/backend/app/schemas/auth.py`: Registration, login, and auth envelope schemas.
8. `apps/backend/app/api/deps.py`: Auth dependencies (`get_current_user`, `require_role`, `require_approved_agent`).
9. `apps/backend/app/utils/slug.py`: URL slug generator with collision avoidance.
10. `apps/backend/app/api/v1/endpoints/auth.py`: Authentication router endpoints.
11. `apps/backend/app/api/v1/endpoints/admin.py`: Admin agent review & overview router endpoints.
12. `apps/backend/app/api/v1/endpoints/users.py`: Users `/me` endpoint.
13. `apps/backend/app/scripts/__init__.py`: Scripts package marker.
14. `apps/backend/app/scripts/create_admin.py`: CLI script for Super Admin management.
15. `apps/backend/app/scripts/seed_dev_data.py`: Development account database seeder.
16. `apps/backend/tests/test_auth.py`: 10 automated authentication tests.
17. `apps/backend/tests/test_rbac.py`: 6 automated RBAC & agent lifecycle tests.
18. `apps/web/src/middleware.ts`: Next.js client navigation UX protection middleware.
19. `PHASE_2_AUTH_RBAC_AGENT_REPORT.md`: This comprehensive Phase 2 report.

---

## 16. Files Modified

1. `apps/backend/requirements.txt`: Added `bcrypt>=4.1.0`, `pyjwt>=2.8.0`, and `email-validator>=2.0.0`.
2. `apps/backend/app/core/config.py`: Added JWT secret, expiration, and cookie configuration fields.
3. `apps/backend/.env.example`: Documented Phase 2 authentication environment variables.
4. `apps/backend/.env`: Configured local dev JWT and cookie settings.
5. `apps/backend/app/db/models/__init__.py`: Exported `User`, `UserRole`, `Agent`, `AgentStatus`.
6. `apps/backend/app/core/exceptions.py`: Added `code` parameter support to `AppException` subclasses.
7. `apps/backend/app/api/v1/router.py`: Mounted `/auth`, `/users`, and `/admin` routers.
8. `apps/backend/tests/conftest.py`: Added autouse DB connection pool cleanup fixture.
9. `apps/web/src/lib/api.ts`: Implemented hybrid routing sending auth and admin requests to FastAPI.
10. `apps/backend/README.md`: Documented Phase 2 architecture, commands, and verification.

---

## 17. Existing Express Status
`apps/api` remains completely intact and undisturbed. Existing non-auth prototype routes (`/products`, `/categories`, `/orders`, `/cart`) continue to run on Express port 5000 during this transitional phase until systematically migrated in subsequent phases.

---

## 18. Known Issues
None. All 21 tests pass with 0 errors and 0 unhandled warnings.

---

## 19. Deferred Features
In accordance with strict Phase 2 boundaries, the following were intentionally deferred:
- Welcome wallet reward bonus logic (deferred to the Wallet/Rewards phase).
- Product catalog, categories, dynamic spec editor, listings (Phase 3).
- Cart, checkout, and order placement (Phase 4).
- Payment gateways, AI assistant, and n8n webhooks (Phases 5+).

---

## 20. Acceptance Checklist

- [x] Database: `users` table created in Neon PostgreSQL.
- [x] Database: `agents` table created in Neon PostgreSQL with foreign key to `users.id`.
- [x] Database: Unique indexes on user email and shop slug.
- [x] Database: Alembic migration applies cleanly (`d08c695be889`).
- [x] Customer Auth: Customer registration works (HTTP 201).
- [x] Customer Auth: Duplicate email rejected (HTTP 409).
- [x] Customer Auth: Login works with verified password (HTTP 200).
- [x] Customer Auth: JWT created with subject and role claims.
- [x] Customer Auth: HTTP-only cookie set on response.
- [x] Customer Auth: `/auth/me` validates cookie and returns user.
- [x] Customer Auth: `/auth/logout` clears cookie.
- [x] Agent: Agent registration atomically creates User and Agent profile.
- [x] Agent: Agent status defaults to `PENDING`.
- [x] Admin: CLI admin creation script (`app.scripts.create_admin`).
- [x] Admin: Admin can list agent applications (`GET /api/v1/admin/agents`).
- [x] Admin: Admin can approve, reject, and suspend agents (`PATCH /api/v1/admin/agents/{id}/status`).
- [x] RBAC: Customer blocked from Admin and Agent endpoints (HTTP 403).
- [x] RBAC: Pending Agent blocked from approved seller endpoints (HTTP 403).
- [x] RBAC: Approved Agent permitted to access seller endpoints (HTTP 200).
- [x] Security: Plaintext passwords never stored (bcrypt salt rounds 12).
- [x] Security: Generic error message on failed login.
- [x] Frontend: Hybrid cutover routes auth requests to FastAPI port 8000.
- [x] Tests: 21 automated tests pass cleanly.
- [x] Express: Existing prototype intact on port 5000.

---

## 21. Phase 3 Readiness
The backend architecture, database schema, security foundation, and role-based permissions are completely solid. The project is ready for **Phase 3: Catalog, Products, and Multi-Vendor Inventory**.

---

## PHASE 2 STATUS SNAPSHOT

- Customer Registration: ✅
- Agent Registration: ✅
- Login: ✅
- Logout: ✅
- Current User: ✅
- JWT: ✅
- HTTP-only Cookies: ✅
- RBAC: ✅
- Agent Approval: ✅
- PostgreSQL Persistence: ✅
- Alembic: ✅
- Frontend Auth Integration: ✅
- Automated Tests: ✅

**Phase 2: COMPLETE**  
**Ready for Phase 3: YES**
