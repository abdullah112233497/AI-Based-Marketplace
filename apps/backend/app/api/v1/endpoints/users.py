from typing import List
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import AppException, ForbiddenException, NotFoundException
from app.db.models.address import Address
from app.db.models.user import User
from app.schemas.address import (
    AddressCreateRequest,
    AddressResponse,
    AddressUpdateRequest,
)
from app.schemas.auth import CurrentUserResponse
from app.schemas.response import StandardApiResponse
from app.schemas.user import UserProfileUpdateRequest, UserSummary
from app.db.session import get_db

router = APIRouter()


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get My User Profile",
    description="Returns detailed profile information for the authenticated user.",
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> CurrentUserResponse:
    return CurrentUserResponse(
        success=True,
        data=UserSummary.from_orm_model(current_user),
        message="User profile retrieved",
    )


@router.patch(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Profile",
    description="Updates authenticated user's personal profile (name, phone) with mass assignment security protection.",
)
async def update_my_profile(
    payload: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurrentUserResponse:
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()

    await db.flush()
    await db.refresh(current_user)

    return CurrentUserResponse(
        success=True,
        data=UserSummary.from_orm_model(current_user),
        message="Profile updated successfully",
    )


@router.get(
    "/me/addresses",
    response_model=StandardApiResponse[List[AddressResponse]],
    summary="List Saved Addresses",
    description="Returns all saved shipping addresses for the authenticated customer.",
)
async def list_my_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[List[AddressResponse]]:
    stmt = (
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.desc())
    )
    addresses = (await db.execute(stmt)).scalars().all()
    items = [AddressResponse.model_validate(a) for a in addresses]

    return StandardApiResponse(
        success=True,
        data=items,
        message=f"Retrieved {len(items)} saved addresses",
    )


@router.post(
    "/me/addresses",
    response_model=StandardApiResponse[AddressResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Address",
    description="Saves a new delivery address. If marked as default, existing default addresses are updated.",
)
async def create_address(
    payload: AddressCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[AddressResponse]:
    # Check if this is the user's first address; if so, make it default automatically
    count_stmt = select(Address.id).where(Address.user_id == current_user.id)
    existing_count = len((await db.execute(count_stmt)).scalars().all())
    set_as_default = payload.is_default or existing_count == 0

    if set_as_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == current_user.id)
            .values(is_default=False)
        )

    new_address = Address(
        user_id=current_user.id,
        label=payload.label,
        recipient_name=payload.recipient_name,
        phone=payload.phone,
        street_address=payload.street_address,
        city=payload.city,
        province=payload.province,
        postal_code=payload.postal_code,
        is_default=set_as_default,
    )
    db.add(new_address)
    await db.flush()
    await db.refresh(new_address)

    return StandardApiResponse(
        success=True,
        data=AddressResponse.model_validate(new_address),
        message="Address created successfully",
    )


@router.patch(
    "/me/addresses/{address_id}",
    response_model=StandardApiResponse[AddressResponse],
    summary="Update Address",
    description="Updates an existing address with strict ownership validation.",
)
async def update_address(
    address_id: str,
    payload: AddressUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[AddressResponse]:
    try:
        addr_uuid = uuid.UUID(address_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid address ID", code="INVALID_ADDRESS_ID", status_code=400)

    stmt = select(Address).where(Address.id == addr_uuid)
    address = (await db.execute(stmt)).scalar_one_or_none()
    if not address:
        raise NotFoundException(message="Address not found", code="ADDRESS_NOT_FOUND")

    if address.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this address", code="FORBIDDEN")

    if payload.is_default is True and not address.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == current_user.id)
            .values(is_default=False)
        )
        address.is_default = True
    elif payload.is_default is False and address.is_default:
        address.is_default = False

    if payload.label is not None:
        address.label = payload.label
    if payload.recipient_name is not None:
        address.recipient_name = payload.recipient_name
    if payload.phone is not None:
        address.phone = payload.phone
    if payload.street_address is not None:
        address.street_address = payload.street_address
    if payload.city is not None:
        address.city = payload.city
    if payload.province is not None:
        address.province = payload.province
    if payload.postal_code is not None:
        address.postal_code = payload.postal_code

    await db.flush()
    await db.refresh(address)

    return StandardApiResponse(
        success=True,
        data=AddressResponse.model_validate(address),
        message="Address updated successfully",
    )


@router.delete(
    "/me/addresses/{address_id}",
    response_model=StandardApiResponse[dict],
    summary="Delete Address",
    description="Removes a saved shipping address with ownership validation.",
)
async def delete_address(
    address_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[dict]:
    try:
        addr_uuid = uuid.UUID(address_id.strip())
    except (ValueError, TypeError):
        raise AppException(message="Invalid address ID", code="INVALID_ADDRESS_ID", status_code=400)

    stmt = select(Address).where(Address.id == addr_uuid)
    address = (await db.execute(stmt)).scalar_one_or_none()
    if not address:
        raise NotFoundException(message="Address not found", code="ADDRESS_NOT_FOUND")

    if address.user_id != current_user.id:
        raise ForbiddenException(message="Access denied: You do not own this address", code="FORBIDDEN")

    await db.delete(address)
    await db.flush()

    return StandardApiResponse(
        success=True,
        data={"deleted": True, "id": str(addr_uuid)},
        message="Address deleted successfully",
    )
