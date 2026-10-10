import uuid
from typing import Callable, Optional, Sequence
from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_access_token
from app.db.models.agent import AgentStatus
from app.db.models.user import User, UserRole
from app.db.session import get_db

settings = get_settings()


def extract_token_from_request(request: Request) -> Optional[str]:
    """
    Extracts authentication JWT token.
    Prioritizes explicit Authorization header (Bearer <token>) if provided,
    otherwise retrieves the session from the HTTP-only auth cookie.
    """
    # 1. Authorization header priority for explicit API/bearer clients
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.strip():
        parts = auth_header.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]

    # 2. Cookie lookup for web browser clients
    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if token and token.strip():
        return token.strip()

    return None


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that parses JWT, fetches active User from database, and ensures session validity.
    """
    token = extract_token_from_request(request)
    if not token:
        raise UnauthorizedException(
            message="Authentication credentials were not provided",
            code="UNAUTHORIZED",
        )

    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException(
            message="Invalid or expired session token",
            code="INVALID_TOKEN",
        )

    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedException(
            message="Malformed token payload: missing subject",
            code="INVALID_TOKEN",
        )

    try:
        user_id = uuid.UUID(str(sub))
    except (ValueError, TypeError):
        raise UnauthorizedException(
            message="Malformed subject identifier",
            code="INVALID_TOKEN",
        )

    stmt = select(User).options(selectinload(User.agent)).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException(
            message="User account no longer exists",
            code="USER_NOT_FOUND",
        )

    if not user.is_active:
        raise ForbiddenException(
            message="Account is inactive or disabled",
            code="ACCOUNT_INACTIVE",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensures current authenticated user is active.
    """
    return current_user


def require_role(*allowed_roles: UserRole) -> Callable:
    """
    Dependency factory enforcing Role-Based Access Control (RBAC).
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                message="Access denied: Insufficient privileges for this action",
                code="FORBIDDEN",
            )
        return current_user

    return role_checker


async def require_approved_agent(
    current_user: User = Depends(require_role(UserRole.AGENT, UserRole.ADMIN)),
) -> User:
    """
    Ensures that an Agent has been reviewed and granted APPROVED status by an Admin.
    Admins are permitted through as superusers.
    """
    if current_user.role == UserRole.ADMIN:
        return current_user

    if not current_user.agent:
        raise ForbiddenException(
            message="Agent shop profile does not exist",
            code="AGENT_PROFILE_MISSING",
        )

    if current_user.agent.status != AgentStatus.APPROVED:
        raise ForbiddenException(
            message="Agent application is pending review or suspended. Full seller access denied.",
            code="AGENT_NOT_APPROVED",
        )

    return current_user


require_admin = require_role(UserRole.ADMIN)
