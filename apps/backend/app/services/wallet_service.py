from typing import List, Optional
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.logging import get_logger
from app.db.models.order import Order, PaymentStatus
from app.db.models.wallet import WalletLedger, WalletTransactionType
from app.services.pricing_service import calculate_cashback_reward

logger = get_logger(__name__)


async def get_user_wallet_balance(db: AsyncSession, user_id: uuid.UUID) -> int:
    """
    Computes real-time available wallet balance from immutable ledger entries.
    """
    stmt = select(func.coalesce(func.sum(WalletLedger.amount), 0)).where(
        WalletLedger.user_id == user_id
    )
    result = await db.execute(stmt)
    return int(result.scalar_one())


async def get_user_wallet_history(
    db: AsyncSession, user_id: uuid.UUID
) -> List[WalletLedger]:
    """
    Retrieves chronological transaction ledger for a customer.
    """
    stmt = (
        select(WalletLedger)
        .where(WalletLedger.user_id == user_id)
        .order_by(WalletLedger.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def credit_order_cashback(
    db: AsyncSession, order: Order
) -> Optional[WalletLedger]:
    """
    Idempotently credits 2% cashback reward to customer upon verified DELIVERED status.
    Guarantees no duplicate reward can ever be granted for the same order.
    """
    if order.reward_credited:
        logger.info("Order %s already has reward_credited=True, skipping cashback", order.order_number)
        return None

    # Database reference check for strict idempotency
    existing_stmt = select(WalletLedger).where(
        WalletLedger.user_id == order.customer_id,
        WalletLedger.reference_order_id == str(order.id),
        WalletLedger.type == WalletTransactionType.EARNED,
    )
    existing_entry = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_entry:
        order.reward_credited = True
        return existing_entry

    cashback_amount = calculate_cashback_reward(order.subtotal)
    if cashback_amount <= 0:
        order.reward_credited = True
        return None

    current_balance = await get_user_wallet_balance(db, order.customer_id)
    new_balance = current_balance + cashback_amount

    ledger_entry = WalletLedger(
        user_id=order.customer_id,
        order_id=order.id,
        type=WalletTransactionType.EARNED,
        amount=cashback_amount,
        balance_after=new_balance,
        description=f"2% Cashback on delivered order #{order.order_number}",
        reference_order_id=str(order.id),
    )
    db.add(ledger_entry)
    order.reward_credited = True
    order.payment_status = PaymentStatus.PAID

    await db.flush()
    logger.info(
        "Credited PKR %d cashback to user %s for order %s (new bal: %d)",
        cashback_amount,
        order.customer_id,
        order.order_number,
        new_balance,
    )
    return ledger_entry


async def deduct_wallet_for_order(
    db: AsyncSession,
    user_id: uuid.UUID,
    order_id: uuid.UUID,
    order_number: str,
    amount: int,
) -> Optional[WalletLedger]:
    """
    Deducts redeemed platform rewards during checkout with balance safety validation.
    """
    if amount <= 0:
        return None

    current_balance = await get_user_wallet_balance(db, user_id)
    if current_balance < amount:
        raise AppException(
            message=f"Insufficient reward wallet balance. Available: PKR {current_balance}, Requested: PKR {amount}",
            code="INSUFFICIENT_WALLET_BALANCE",
            status_code=400,
        )

    new_balance = current_balance - amount
    ledger_entry = WalletLedger(
        user_id=user_id,
        order_id=order_id,
        type=WalletTransactionType.SPENT,
        amount=-amount,
        balance_after=new_balance,
        description=f"Redeemed on Order #{order_number}",
        reference_order_id=str(order_id),
    )
    db.add(ledger_entry)
    await db.flush()
    return ledger_entry


async def refund_wallet_for_cancelled_order(
    db: AsyncSession, order: Order
) -> Optional[WalletLedger]:
    """
    Restores redeemed wallet reward funds if an order is cancelled.
    Idempotent: verifies no duplicate REFUND ledger entry exists.
    """
    if order.wallet_discount <= 0:
        return None

    existing_stmt = select(WalletLedger).where(
        WalletLedger.user_id == order.customer_id,
        WalletLedger.reference_order_id == str(order.id),
        WalletLedger.type == WalletTransactionType.REFUND,
    )
    existing_refund = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing_refund:
        return existing_refund

    current_balance = await get_user_wallet_balance(db, order.customer_id)
    refund_amount = order.wallet_discount
    new_balance = current_balance + refund_amount

    ledger_entry = WalletLedger(
        user_id=order.customer_id,
        order_id=order.id,
        type=WalletTransactionType.REFUND,
        amount=refund_amount,
        balance_after=new_balance,
        description=f"Refunded wallet balance from cancelled Order #{order.order_number}",
        reference_order_id=str(order.id),
    )
    db.add(ledger_entry)
    await db.flush()
    logger.info("Refunded PKR %d to user %s for cancelled order %s", refund_amount, order.customer_id, order.order_number)
    return ledger_entry
