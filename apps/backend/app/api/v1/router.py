from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    agents,
    auth,
    cart,
    categories,
    commission,
    health,
    notifications,
    orders,
    products,
    reviews,
    users,
    wallet,
    watchlist,
    wishlist,
)

v1_router = APIRouter()

# System & Health Endpoints
v1_router.include_router(health.router)

# Phase 2: Authentication, Identity, Users & RBAC
v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
v1_router.include_router(users.router, prefix="/users", tags=["Users"])
v1_router.include_router(admin.router, prefix="/admin", tags=["Super Admin"])

# Phase 3: Catalog, Products, Categories, Dynamic Specs & Agent Listings
v1_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
v1_router.include_router(products.router, prefix="/products", tags=["Products"])
v1_router.include_router(agents.router, prefix="/agent", tags=["Agents & Vendors"])
v1_router.include_router(agents.router, prefix="/agents", tags=["Agents & Vendors"], include_in_schema=False)

# Phase 4: Cart, Checkout, Orders, Wallet & Commission
v1_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
v1_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
v1_router.include_router(wallet.router, prefix="/customer", tags=["Customer Wallet"])
v1_router.include_router(commission.router, prefix="/admin", tags=["Admin Commission"])

# Phase 5: Reviews, Wishlist/Watchlist, In-App Notifications & Customer Profile
v1_router.include_router(wishlist.router, prefix="/wishlist", tags=["Wishlist"])
v1_router.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
v1_router.include_router(reviews.router, tags=["Reviews"])
