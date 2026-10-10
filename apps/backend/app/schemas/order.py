from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.db.models.order import OrderStatus, PaymentMethod, PaymentStatus


class ShippingAddressInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(..., min_length=2, max_length=150, alias="fullName")
    phone: str = Field(..., min_length=8, max_length=50)
    street_address: str = Field(..., min_length=5, max_length=255, alias="streetAddress")
    city: str = Field(..., min_length=2, max_length=100)
    state_province: str = Field(default="Pakistan", alias="stateProvince")
    postal_code: Optional[str] = Field(default=None, alias="postalCode")


class CheckoutItemInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: str = Field(..., alias="productId")
    variant_id: Optional[str] = Field(default=None, alias="variantId")
    quantity: int = Field(default=1, ge=1)


class OrderPreviewRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[CheckoutItemInput] = Field(..., min_length=1)
    apply_wallet_amount: int = Field(default=0, ge=0, alias="applyWalletAmount")
    use_wallet: Optional[bool] = Field(default=False, alias="useWallet")
    shipping_address: Optional[ShippingAddressInput] = Field(default=None, alias="shippingAddress")


class OrderPreviewItemResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: str = Field(..., alias="productId")
    title: str
    image: Optional[str] = None
    price: int
    quantity: int
    item_total: int = Field(..., alias="itemTotal")
    agent_id: str = Field(..., alias="agentId")
    agent_shop_name: str = Field(..., alias="agentShopName")
    stock: int


class OrderPreviewResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: List[OrderPreviewItemResponse]
    subtotal: int
    shipping_fee: int = Field(..., alias="shippingFee")
    wallet_discount: int = Field(default=0, alias="walletDiscount")
    grand_total: int = Field(..., alias="grandTotal")
    total_amount: int = Field(..., alias="totalAmount")
    estimated_reward: int = Field(default=0, alias="estimatedReward")


class OrderCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: Optional[List[CheckoutItemInput]] = Field(default=None)
    shipping_address: ShippingAddressInput = Field(..., alias="shippingAddress")
    payment_method: PaymentMethod = Field(default=PaymentMethod.COD, alias="paymentMethod")
    apply_wallet_amount: int = Field(default=0, ge=0, alias="applyWalletAmount")
    use_wallet: Optional[bool] = Field(default=False, alias="useWallet")
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    product_id: Optional[str] = Field(default=None, alias="productId")
    product_title: str = Field(..., alias="productTitle")
    product_slug: str = Field(..., alias="productSlug")
    product_image: Optional[str] = Field(default=None, alias="productImage")
    variant_id: Optional[str] = Field(default=None, alias="variantId")
    unit_price: int = Field(..., alias="unitPrice")
    quantity: int
    total_price: int = Field(..., alias="totalPrice")
    agent_id: str = Field(..., alias="agentId")
    agent_shop_name: str = Field(..., alias="agentShopName")


class OrderSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    order_number: str = Field(..., alias="orderNumber")
    customer_id: str = Field(..., alias="customerId")
    customer_name: str = Field(..., alias="customerName")
    customer_phone: str = Field(..., alias="customerPhone")
    status: OrderStatus
    payment_method: PaymentMethod = Field(..., alias="paymentMethod")
    payment_status: PaymentStatus = Field(..., alias="paymentStatus")
    shipping_address: Dict[str, Any] = Field(..., alias="shippingAddress")
    subtotal: int
    shipping_fee: int = Field(..., alias="shippingFee")
    wallet_discount: int = Field(..., alias="walletDeduction")  # compatible with frontend walletDeduction / walletDiscount
    total_amount: int = Field(..., alias="totalAmount")
    reward_credited: bool = Field(default=False, alias="rewardCredited")
    notes: Optional[str] = None
    tracking_number: Optional[str] = Field(default=None, alias="trackingNumber")
    courier_name: Optional[str] = Field(default=None, alias="courierName")
    cancellation_reason: Optional[str] = Field(default=None, alias="cancellationReason")
    created_at: Optional[datetime] = Field(default=None, alias="createdAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt")
    delivered_at: Optional[datetime] = Field(default=None, alias="deliveredAt")
    items: List[OrderItemResponse] = Field(default_factory=list)


class UpdateOrderStatusRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: OrderStatus
    tracking_number: Optional[str] = Field(default=None, alias="trackingNumber")
    courier_name: Optional[str] = Field(default=None, alias="courierName")
    cancellation_reason: Optional[str] = Field(default=None, alias="cancellationReason")


def serialize_order_summary(order: Any, items_override: Optional[List[Any]] = None) -> OrderSummaryResponse:
    item_responses = []
    items_to_use = items_override
    if items_to_use is None:
        try:
            items_to_use = getattr(order, "items", [])
        except Exception:
            items_to_use = []

    if items_to_use:
        for item in items_to_use:
            item_responses.append(
                OrderItemResponse(
                    id=str(item.id),
                    productId=str(item.product_id) if item.product_id else None,
                    productTitle=item.product_title,
                    productSlug=item.product_slug,
                    productImage=item.product_image,
                    variantId=item.variant_id,
                    unitPrice=item.unit_price,
                    quantity=item.quantity,
                    totalPrice=item.total_price,
                    agentId=str(item.agent_id),
                    agentShopName=item.agent_shop_name,
                )
            )

    return OrderSummaryResponse(
        id=str(order.id),
        orderNumber=order.order_number,
        customerId=str(order.customer_id),
        customerName=order.customer_name,
        customerPhone=order.customer_phone,
        status=order.status,
        paymentMethod=order.payment_method,
        paymentStatus=order.payment_status,
        shippingAddress=order.shipping_address if isinstance(order.shipping_address, dict) else {},
        subtotal=order.subtotal,
        shippingFee=order.shipping_fee,
        walletDeduction=order.wallet_discount,
        totalAmount=order.total_amount,
        rewardCredited=order.reward_credited,
        notes=order.notes,
        trackingNumber=order.tracking_number,
        courierName=order.courier_name,
        cancellationReason=order.cancellation_reason,
        createdAt=order.created_at,
        updatedAt=order.updated_at,
        deliveredAt=order.delivered_at,
        items=item_responses,
    )
