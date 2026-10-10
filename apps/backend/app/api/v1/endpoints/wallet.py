from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.response import StandardApiResponse
from app.schemas.wallet import CustomerWalletResponse, WalletLedgerResponse
from app.services.wallet_service import (
    get_user_wallet_balance,
    get_user_wallet_history,
)

router = APIRouter()


@router.get(
    "/wallet",
    response_model=StandardApiResponse[CustomerWalletResponse],
    summary="Get Customer Rewards Wallet",
    description="Returns available reward balance and chronological ledger of cashback earnings, redemptions, and refunds.",
)
async def get_customer_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StandardApiResponse[CustomerWalletResponse]:
    balance = await get_user_wallet_balance(db, current_user.id)
    history = await get_user_wallet_history(db, current_user.id)

    ledger_items = [WalletLedgerResponse.model_validate(entry) for entry in history]

    return StandardApiResponse(
        success=True,
        data=CustomerWalletResponse(
            balance=balance,
            ledgers=ledger_items,
            ledger=ledger_items,
        ),
        message="Customer wallet retrieved",
    )
