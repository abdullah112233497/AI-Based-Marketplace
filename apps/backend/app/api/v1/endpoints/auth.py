from typing import Optional
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import (
    get_current_user,
    require_approved_agent,
    require_role,
)
from app.core.config import get_settings
from app.core.exceptions import ConflictException, ForbiddenException, UnauthorizedException
from app.core.logging import get_logger
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models.agent import Agent, AgentStatus
from app.db.models.user import User, UserRole
from app.db.session import get_db
from app.schemas.auth import (
    AuthData,
    AuthResponse,
    CurrentUserResponse,
    CustomerRegisterRequest,
    AgentRegisterRequest,
    LoginRequest,
)
from app.schemas.response import StandardApiResponse
from app.schemas.user import UserSummary
from app.utils.slug import generate_unique_shop_slug

logger = get_logger(__name__)
settings = get_settings()

router = APIRouter()


def set_auth_cookie(response: Response, token: str) -> None:
    """
    Sets a secure HTTP-only authentication cookie on the client response.
    """
    max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE.lower(),
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    """
    Clears the HTTP-only authentication cookie from the client.
    """
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE.lower(),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Customer",
    description="Registers a new customer account with role CUSTOMER, issues session token and cookie.",
)
async def register_customer(
    payload: CustomerRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    # 1. Duplicate email check
    stmt = select(User.id).where(User.email == payload.email)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none() is not None:
        raise ConflictException(
            message="An account with this email already exists",
            code="EMAIL_EXISTS",
        )

    # 2. Hash password & create user
    hashed = hash_password(payload.password)
    user = User(
        name=payload.name.strip(),
        email=payload.email,
        phone=payload.phone.strip(),
        password_hash=hashed,
        role=UserRole.CUSTOMER,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # 3. Create session JWT
    token = create_access_token(subject=str(user.id), role=user.role.value)
    set_auth_cookie(response, token)

    logger.info("New customer registered: email=%s id=%s", user.email, str(user.id))

    return AuthResponse(
        success=True,
        data=AuthData(
            token=token,
            user=UserSummary.from_orm_model(user),
        ),
        message="Customer registered successfully",
    )


@router.post(
    "/register-agent",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Vendor / Agent Application",
    description="Atomically creates an AGENT User and linked Agent shop profile with default PENDING status.",
)
async def register_agent(
    payload: AgentRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    # 1. Duplicate email check
    stmt = select(User.id).where(User.email == payload.email)
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none() is not None:
        raise ConflictException(
            message="An account with this email already exists",
            code="EMAIL_EXISTS",
        )

    # 2. Generate collision-free shop slug
    shop_slug = await generate_unique_shop_slug(db, payload.shop_name)

    # 3. Atomically create User and Agent profile
    hashed = hash_password(payload.password)
    user = User(
        name=payload.name.strip(),
        email=payload.email,
        phone=payload.phone.strip(),
        password_hash=hashed,
        role=UserRole.AGENT,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()  # Generates user.id for foreign key

    agent = Agent(
        user_id=user.id,
        shop_name=payload.shop_name.strip(),
        shop_slug=shop_slug,
        shop_description=payload.shop_description.strip() if payload.shop_description else "Newly registered vendor on Tech Marketplace",
        city=payload.city.strip(),
        address=payload.address.strip(),
        contact_phone=payload.phone.strip(),
        cnic_or_tax_id=payload.cnic_or_tax_id.strip() if payload.cnic_or_tax_id else None,
        status=AgentStatus.PENDING,
        is_verified=False,
        rating=5.0,
        rating_count=0,
        product_count=0,
    )
    db.add(agent)
    await db.flush()

    # Re-fetch user with agent relationship
    stmt_user = select(User).options(selectinload(User.agent)).where(User.id == user.id)
    user_loaded = (await db.execute(stmt_user)).scalar_one()

    # 4. Generate token and set cookie
    token = create_access_token(subject=str(user.id), role=user.role.value)
    set_auth_cookie(response, token)

    logger.info(
        "New agent application registered: email=%s shop=%s slug=%s status=PENDING",
        user.email,
        agent.shop_name,
        shop_slug,
    )

    return AuthResponse(
        success=True,
        data=AuthData(
            token=token,
            user=UserSummary.from_orm_model(user_loaded),
        ),
        message="Agent application submitted successfully. Status is PENDING admin review.",
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates credentials for Customer, Agent, or Admin, issuing JWT and HTTP-only cookie.",
)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    # 1. Fetch user by email
    stmt = select(User).options(selectinload(User.agent)).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Generic invalid credentials protection against account enumeration
    if not user or not verify_password(payload.password, user.password_hash):
        logger.warning("Failed login attempt for email=%s", payload.email)
        raise UnauthorizedException(
            message="Incorrect email or password",
            code="INVALID_CREDENTIALS",
        )

    # 2. Check active state
    if not user.is_active:
        logger.warning("Inactive account login attempted for email=%s", payload.email)
        raise ForbiddenException(
            message="Account is deactivated or suspended. Please contact support.",
            code="ACCOUNT_INACTIVE",
        )

    # 3. Generate token & set cookie
    token = create_access_token(subject=str(user.id), role=user.role.value)
    set_auth_cookie(response, token)

    logger.info("User login successful: id=%s role=%s", str(user.id), user.role.value)

    return AuthResponse(
        success=True,
        data=AuthData(
            token=token,
            user=UserSummary.from_orm_model(user),
        ),
        message="Login successful",
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User",
    description="Returns authenticated user session details and linked Agent profile if applicable.",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> CurrentUserResponse:
    return CurrentUserResponse(
        success=True,
        data=UserSummary.from_orm_model(current_user),
        message="Session active",
    )


@router.post(
    "/logout",
    response_model=StandardApiResponse[None],
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Invalidates client session by clearing HTTP-only authentication cookie.",
)
async def logout(response: Response) -> StandardApiResponse[None]:
    clear_auth_cookie(response)
    return StandardApiResponse(
        success=True,
        data=None,
        message="Logged out successfully",
    )


# ==============================================================================
# RBAC Validation Endpoints (Demonstrating & Testing Role Enforcement)
# ==============================================================================

@router.get(
    "/test/customer-only",
    response_model=StandardApiResponse[dict],
    summary="Customer-Only Protected Route",
    description="Endpoint accessible exclusively to users with CUSTOMER role.",
)
async def test_customer_route(
    current_user: User = Depends(require_role(UserRole.CUSTOMER)),
) -> StandardApiResponse[dict]:
    return StandardApiResponse(
        success=True,
        data={"message": "Welcome customer", "userId": str(current_user.id)},
    )


@router.get(
    "/test/agent-only",
    response_model=StandardApiResponse[dict],
    summary="Agent-Only Protected Route",
    description="Endpoint accessible to any user with AGENT role.",
)
async def test_agent_route(
    current_user: User = Depends(require_role(UserRole.AGENT)),
) -> StandardApiResponse[dict]:
    return StandardApiResponse(
        success=True,
        data={"message": "Welcome agent", "userId": str(current_user.id)},
    )


@router.get(
    "/test/approved-agent-only",
    response_model=StandardApiResponse[dict],
    summary="Approved-Agent-Only Protected Route",
    description="Endpoint strictly requiring an Agent user whose shop has APPROVED status.",
)
async def test_approved_agent_route(
    current_user: User = Depends(require_approved_agent),
) -> StandardApiResponse[dict]:
    return StandardApiResponse(
        success=True,
        data={
            "message": "Welcome approved vendor",
            "userId": str(current_user.id),
            "shopName": current_user.agent.shop_name if current_user.agent else None,
            "status": current_user.agent.status.value if current_user.agent else None,
        },
    )
