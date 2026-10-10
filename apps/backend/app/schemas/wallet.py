from datetime import datetime
from typing import Any, List, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.db.models.wallet import WalletTransactionType


class WalletLedgerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Union[str, uuid.UUID]
    type: WalletTransactionType
    transaction_type: WalletTransactionType = Field(alias="transactionType")
    amount: int
    balance_after: int = Field(..., alias="balanceAfter")
    description: str
    reference_order_id: Optional[Union[str, uuid.UUID]] = Field(default=None, alias="referenceOrderId")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")

    @model_validator(mode="before")
    @classmethod
    def resolve_transaction_type(cls, data: Any) -> Any:
        if hasattr(data, "type"):
            return {
                "id": str(data.id),
                "type": data.type,
                "transactionType": data.type,
                "amount": data.amount,
                "balanceAfter": data.balance_after,
                "description": data.description,
                "referenceOrderId": data.reference_order_id,
                "createdAt": data.created_at,
            }
        elif isinstance(data, dict):
            t = data.get("type") or data.get("transactionType")
            data["type"] = t
            data["transactionType"] = t
        return data


class CustomerWalletResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    balance: int
    ledgers: List[WalletLedgerResponse] = Field(default_factory=list)
    ledger: List[WalletLedgerResponse] = Field(default_factory=list)
