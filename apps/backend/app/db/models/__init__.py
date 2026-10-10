"""
Database models package for Phase 1 through Phase 5:
Users, Roles, Agents, Categories, Brands, Products, Carts, Orders,
Commissions, Wallet, Addresses, Wishlist, Watchlist, Reviews,
Notifications, and Domain Events.
"""
from app.db.base import Base
from app.db.models.user import User, UserRole
from app.db.models.agent import Agent, AgentStatus
from app.db.models.category import Category
from app.db.models.brand import Brand
from app.db.models.product import Product, ProductCondition, ProductStatus
from app.db.models.cart import Cart, CartItem
from app.db.models.order import Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus
from app.db.models.commission import (
    CommissionRule,
    CommissionRecord,
    CommissionRuleType,
    CommissionStatus,
)
from app.db.models.wallet import WalletLedger, WalletTransactionType
from app.db.models.address import Address
from app.db.models.wishlist import WishlistItem
from app.db.models.watchlist import ProductWatch
from app.db.models.review import Review, ReviewStatus
from app.db.models.notification import Notification, NotificationType
from app.db.models.event import DomainEvent

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Agent",
    "AgentStatus",
    "Category",
    "Brand",
    "Product",
    "ProductCondition",
    "ProductStatus",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentMethod",
    "PaymentStatus",
    "CommissionRule",
    "CommissionRecord",
    "CommissionRuleType",
    "CommissionStatus",
    "WalletLedger",
    "WalletTransactionType",
    "Address",
    "WishlistItem",
    "ProductWatch",
    "Review",
    "ReviewStatus",
    "Notification",
    "NotificationType",
    "DomainEvent",
]
