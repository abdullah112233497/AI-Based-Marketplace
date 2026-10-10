import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.db.models.event import DomainEvent
from app.db.models.notification import Notification, NotificationType
from app.db.models.order import Order, OrderStatus
from app.db.models.product import Product
from app.db.models.review import Review, ReviewStatus
from app.db.session import get_db

ADMIN_CREDENTIALS = {
    "email": "admin@techmarketplace.pk",
    "password": "Admin123!",
}


async def get_admin_token(client: AsyncClient) -> str:
    res = await client.post("/api/v1/auth/login", json=ADMIN_CREDENTIALS)
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["data"]["token"]


async def create_and_approve_agent(client: AsyncClient, name_prefix: str = "Vendor") -> tuple[str, str, dict]:
    unique_suffix = uuid.uuid4().hex[:8]
    agent_email = f"agent_{name_prefix.lower()}_{unique_suffix}@test.com"
    reg = await client.post("/api/v1/auth/register-agent", json={
        "name": f"{name_prefix} {unique_suffix}",
        "email": agent_email,
        "phone": "03001234567",
        "password": "Password123!",
        "shopName": f"{name_prefix} Shop {unique_suffix}",
        "city": "Lahore",
        "address": "Hafeez Centre Shop 22",
        "cnicOrTaxId": "35201-1234567-1",
    })
    assert reg.status_code == 201, f"Agent registration failed: {reg.text}"
    agent_data = reg.json()["data"]
    agent_token = agent_data["token"]
    agent_profile = agent_data["user"]["agentProfile"]
    agent_id = agent_profile["id"]

    admin_token = await get_admin_token(client)
    approve_res = await client.patch(
        f"/api/v1/admin/agents/{agent_id}/status",
        json={"status": "APPROVED", "isVerified": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_res.status_code == 200, f"Agent approval failed: {approve_res.text}"

    return agent_token, agent_id, agent_profile


async def register_customer(client: AsyncClient, name_prefix: str = "Customer") -> tuple[str, str]:
    unique_suffix = uuid.uuid4().hex[:8]
    cust_res = await client.post("/api/v1/auth/register", json={
        "name": f"{name_prefix} {unique_suffix}",
        "email": f"cust_{name_prefix.lower()}_{unique_suffix}@test.com",
        "phone": "03009999999",
        "password": "Password123!",
    })
    assert cust_res.status_code == 201, f"Customer registration failed: {cust_res.text}"
    data = cust_res.json()["data"]
    return data["token"], data["user"]["id"]


async def create_published_product(
    client: AsyncClient,
    agent_token: str,
    title: str = "Test Smartphone",
    price: int = 50000,
    stock: int = 10,
    category_slug: str = "mobiles",
) -> dict:
    create_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": title,
            "description": f"Detailed description for {title}",
            "categoryId": category_slug,
            "brand": "Samsung",
            "condition": "NEW",
            "basePrice": price,
            "stock": stock,
            "images": ["https://images.unsplash.com/photo-test.jpg"],
            "specs": {"ram_gb": "8", "storage_gb": "128"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert create_res.status_code == 201, f"Product creation failed: {create_res.text}"
    return create_res.json()["data"]


async def deliver_order_via_agent(client: AsyncClient, agent_token: str, order_id: str) -> None:
    headers = {"Authorization": f"Bearer {agent_token}"}
    await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "CONFIRMED"},
        headers=headers,
    )
    await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "SHIPPED"},
        headers=headers,
    )
    res = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "DELIVERED"},
        headers=headers,
    )
    assert res.status_code == 200, f"Delivery failed: {res.text}"


# ==============================================================================
# 1. Customer Profile & Mass-Assignment Protection
# ==============================================================================

@pytest.mark.asyncio
async def test_customer_profile_and_mass_assignment_protection(client: AsyncClient) -> None:
    cust_token, user_id = await register_customer(client, "ProfileUser")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Fetch own profile via /users/me
    me_res = await client.get("/api/v1/users/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()["data"]
    assert user_data["id"] == user_id
    assert user_data["role"] == "CUSTOMER"

    # 2. Update allowed fields: name & phone
    patch_res = await client.patch(
        "/api/v1/users/me",
        json={"name": "Muhammad Saad Updated", "phone": "03112223334"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated_user = patch_res.json()["data"]
    assert updated_user["name"] == "Muhammad Saad Updated"
    assert updated_user["phone"] == "03112223334"

    # 3. Attempt Mass-Assignment Attack (trying to escalate role or change email)
    exploit_res = await client.patch(
        "/api/v1/users/me",
        json={"role": "ADMIN", "email": "hacked@admin.com"},
        headers=headers,
    )
    assert exploit_res.status_code == 200
    exploit_data = exploit_res.json()["data"]
    # Role and email MUST remain unchanged
    assert exploit_data["role"] == "CUSTOMER"
    assert exploit_data["email"] == user_data["email"]


# ==============================================================================
# 2. Saved Addresses CRUD & Default Switching
# ==============================================================================

@pytest.mark.asyncio
async def test_saved_addresses_crud_and_default_switching(client: AsyncClient) -> None:
    cust_token, _ = await register_customer(client, "AddressUser")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Create first address (marked as default)
    addr1_res = await client.post(
        "/api/v1/users/me/addresses",
        json={
            "recipientName": "Saad Home",
            "phone": "03001112233",
            "street": "Street 10, Sector F-7",
            "city": "Islamabad",
            "province": "Federal Capital",
            "postalCode": "44000",
            "isDefault": True,
            "tag": "HOME",
        },
        headers=headers,
    )
    assert addr1_res.status_code == 201
    addr1 = addr1_res.json()["data"]
    assert addr1["isDefault"] is True
    assert addr1["tag"] == "HOME"
    addr1_id = addr1["id"]

    # 2. Create second address (marked as default, should demote addr1)
    addr2_res = await client.post(
        "/api/v1/users/me/addresses",
        json={
            "recipientName": "Saad Office",
            "phone": "03004445566",
            "street": "Blue Area Tower B",
            "city": "Islamabad",
            "isDefault": True,
            "tag": "WORK",
        },
        headers=headers,
    )
    assert addr2_res.status_code == 201
    addr2 = addr2_res.json()["data"]
    assert addr2["isDefault"] is True
    addr2_id = addr2["id"]

    # 3. List addresses and verify only addr2 is default
    list_res = await client.get("/api/v1/users/me/addresses", headers=headers)
    assert list_res.status_code == 200
    addresses = list_res.json()["data"]
    assert len(addresses) == 2
    for a in addresses:
        if a["id"] == addr1_id:
            assert a["isDefault"] is False
        elif a["id"] == addr2_id:
            assert a["isDefault"] is True

    # 4. Switch addr1 back to default
    switch_res = await client.patch(
        f"/api/v1/users/me/addresses/{addr1_id}",
        json={"isDefault": True},
        headers=headers,
    )
    assert switch_res.status_code == 200
    assert switch_res.json()["data"]["isDefault"] is True

    # 5. Verify addr2 is now not default
    list_again = await client.get("/api/v1/users/me/addresses", headers=headers)
    for a in list_again.json()["data"]:
        if a["id"] == addr2_id:
            assert a["isDefault"] is False

    # 6. Delete addr2
    del_res = await client.delete(f"/api/v1/users/me/addresses/{addr2_id}", headers=headers)
    assert del_res.status_code == 200

    # 7. Verify deletion
    final_list = await client.get("/api/v1/users/me/addresses", headers=headers)
    assert len(final_list.json()["data"]) == 1

    # 8. Multi-tenant isolation: another customer cannot access or delete addr1
    other_token, _ = await register_customer(client, "OtherUser")
    other_del = await client.delete(
        f"/api/v1/users/me/addresses/{addr1_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert other_del.status_code in (404, 403)


# ==============================================================================
# 3. Wishlist Lifecycle & Uniqueness
# ==============================================================================

@pytest.mark.asyncio
async def test_wishlist_lifecycle(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "WishAgent")
    prod = await create_published_product(client, agent_token, title="RTX 4090 GPU", price=450000, stock=3)
    prod_id = prod["id"]

    cust_token, _ = await register_customer(client, "WishCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Check initially not in wishlist
    check_res = await client.get(f"/api/v1/wishlist/check/{prod_id}", headers=headers)
    assert check_res.status_code == 200
    assert check_res.json()["data"]["isInWishlist"] is False

    # 2. Add product to wishlist
    add_res = await client.post(f"/api/v1/wishlist/{prod_id}", headers=headers)
    assert add_res.status_code == 201
    wish_item = add_res.json()["data"]
    assert wish_item["productId"] == prod_id
    assert wish_item["product"]["title"] == "RTX 4090 GPU"

    # 3. Duplicate addition is idempotent
    dup_res = await client.post(f"/api/v1/wishlist/{prod_id}", headers=headers)
    assert dup_res.status_code in (200, 201)

    # 4. Check status is now True
    check_res2 = await client.get(f"/api/v1/wishlist/check/{prod_id}", headers=headers)
    assert check_res2.status_code == 200
    assert check_res2.json()["data"]["isInWishlist"] is True

    # 5. List wishlist
    list_res = await client.get("/api/v1/wishlist", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    # 6. Remove product from wishlist
    del_res = await client.delete(f"/api/v1/wishlist/{prod_id}", headers=headers)
    assert del_res.status_code == 200

    # 7. Verify removed
    list_res2 = await client.get("/api/v1/wishlist", headers=headers)
    assert len(list_res2.json()["data"]) == 0


# ==============================================================================
# 4. Watchlist Price Drop & Back-in-Stock Alerts
# ==============================================================================

@pytest.mark.asyncio
async def test_watchlist_price_drop_and_stock_alerts(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "WatchAgent")
    prod = await create_published_product(
        client, agent_token, title="MacBook Pro M3", price=600000, stock=0
    )
    prod_id = prod["id"]

    cust_token, cust_user_id = await register_customer(client, "WatchCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Customer creates watchlist subscription
    watch_res = await client.post(
        "/api/v1/watchlist",
        json={
            "productId": prod_id,
            "watchPriceDrop": True,
            "watchBackInStock": True,
            "targetPrice": 550000,
        },
        headers=headers,
    )
    assert watch_res.status_code == 201
    watch_data = watch_res.json()["data"]
    assert watch_data["watchPriceDrop"] is True
    assert watch_data["watchBackInStock"] is True

    # 2. Agent drops price from 600,000 to 520,000
    update_price_res = await client.put(
        f"/api/v1/agent/products/{prod_id}",
        json={"basePrice": 520000},
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert update_price_res.status_code == 200

    # 3. Agent restocks inventory from 0 to 5
    update_stock_res = await client.put(
        f"/api/v1/agent/products/{prod_id}",
        json={"stock": 5},
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert update_stock_res.status_code == 200

    # 4. Check Customer notifications for PRICE_DROP and BACK_IN_STOCK
    notifs_res = await client.get("/api/v1/notifications", headers=headers)
    assert notifs_res.status_code == 200
    items = notifs_res.json()["data"]["items"]
    types = [n["type"] for n in items]
    assert "PRICE_DROP" in types
    assert "BACK_IN_STOCK" in types


# ==============================================================================
# 5. Verified Purchase Review Lifecycle & Rating Aggregation
# ==============================================================================

@pytest.mark.asyncio
async def test_verified_purchase_review_lifecycle(client: AsyncClient) -> None:
    agent_token, agent_id, _ = await create_and_approve_agent(client, "ReviewAgent")
    prod = await create_published_product(
        client, agent_token, title="Sony WH-1000XM5", price=85000, stock=10
    )
    prod_id = prod["id"]

    cust_token, _ = await register_customer(client, "ReviewCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Non-purchaser checks review eligibility -> false
    elig_res = await client.get(f"/api/v1/products/{prod_id}/review-eligibility", headers=headers)
    assert elig_res.status_code == 200
    assert elig_res.json()["data"]["eligible"] is False

    # 2. Non-purchaser tries to submit review -> 403 Forbidden
    fake_review_res = await client.post(
        f"/api/v1/products/{prod_id}/reviews",
        json={"rating": 5, "comment": "Never bought this but it looks cool!"},
        headers=headers,
    )
    assert fake_review_res.status_code == 403

    # 3. Customer buys the product via Cart & Checkout
    await client.post(
        "/api/v1/cart/items",
        json={"productId": prod_id, "quantity": 1},
        headers=headers,
    )
    checkout_res = await client.post(
        "/api/v1/orders",
        json={
            "shippingAddress": {
                "fullName": "Reviewer",
                "phone": "03001234567",
                "streetAddress": "Mall Road 5",
                "city": "Lahore",
            },
            "paymentMethod": "COD",
        },
        headers=headers,
    )
    assert checkout_res.status_code == 201, f"Checkout failed: {checkout_res.text}"
    order_data = checkout_res.json()["data"]
    order_id = order_data["id"]

    # 4. Status is PENDING -> still not eligible until DELIVERED
    elig_pending = await client.get(f"/api/v1/products/{prod_id}/review-eligibility", headers=headers)
    assert elig_pending.json()["data"]["eligible"] is False

    # 5. Agent marks order as DELIVERED through fulfillment workflow
    await deliver_order_via_agent(client, agent_token, order_id)

    # 6. Customer is now ELIGIBLE for verified purchase review
    elig_delivered = await client.get(f"/api/v1/products/{prod_id}/review-eligibility", headers=headers)
    assert elig_delivered.status_code == 200
    assert elig_delivered.json()["data"]["eligible"] is True

    # 7. Submit 5-star verified review
    rev_res = await client.post(
        f"/api/v1/products/{prod_id}/reviews",
        json={"rating": 5, "comment": "Outstanding active noise cancellation and build quality."},
        headers=headers,
    )
    assert rev_res.status_code == 201
    rev_data = rev_res.json()["data"]
    assert rev_data["rating"] == 5
    assert rev_data["verifiedPurchase"] is True
    review_id = rev_data["id"]

    # 8. Duplicate review rejected
    dup_review_res = await client.post(
        f"/api/v1/products/{prod_id}/reviews",
        json={"rating": 4, "comment": "Trying to review again."},
        headers=headers,
    )
    assert dup_review_res.status_code in (400, 403)

    # 9. Verify live aggregated product rating
    prod_res = await client.get(f"/api/v1/products/{prod_id}")
    assert prod_res.status_code == 200
    assert prod_res.json()["data"]["rating"] == 5.0
    assert prod_res.json()["data"]["reviewCount"] == 1

    # 10. Update review to 4 stars
    patch_rev = await client.patch(
        f"/api/v1/reviews/{review_id}",
        json={"rating": 4, "comment": "Updated: Sound is 4 stars on bass."},
        headers=headers,
    )
    assert patch_rev.status_code == 200
    assert patch_rev.json()["data"]["rating"] == 4

    # 11. Verify product rating recalculated to 4.0
    prod_res2 = await client.get(f"/api/v1/products/{prod_id}")
    assert prod_res2.json()["data"]["rating"] == 4.0


# ==============================================================================
# 6. Admin Review Moderation & Live Recalculation
# ==============================================================================

@pytest.mark.asyncio
async def test_admin_review_moderation(client: AsyncClient) -> None:
    admin_token = await get_admin_token(client)
    agent_token, _, _ = await create_and_approve_agent(client, "ModAgent")
    prod = await create_published_product(client, agent_token, title="Modded iPad", price=120000, stock=5)
    prod_id = prod["id"]

    cust_token, _ = await register_customer(client, "ModCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # Order & deliver
    await client.post("/api/v1/cart/items", json={"productId": prod_id, "quantity": 1}, headers=headers)
    checkout = await client.post(
        "/api/v1/orders",
        json={
            "shippingAddress": {
                "fullName": "Mod Buyer",
                "phone": "03001234567",
                "streetAddress": "Street 1",
                "city": "Lahore",
            },
            "paymentMethod": "COD",
        },
        headers=headers,
    )
    assert checkout.status_code == 201, f"Checkout failed: {checkout.text}"
    order_id = checkout.json()["data"]["id"]
    await deliver_order_via_agent(client, agent_token, order_id)

    # Post review
    rev_res = await client.post(
        f"/api/v1/products/{prod_id}/reviews",
        json={"rating": 5, "comment": "Great device!"},
        headers=headers,
    )
    review_id = rev_res.json()["data"]["id"]

    # Admin lists moderation reviews
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    admin_list = await client.get("/api/v1/admin/reviews", headers=admin_headers)
    assert admin_list.status_code == 200
    assert any(r["id"] == review_id for r in admin_list.json()["data"])

    # Admin hides the review
    hide_res = await client.patch(
        f"/api/v1/admin/reviews/{review_id}/status",
        json={"status": "HIDDEN"},
        headers=admin_headers,
    )
    assert hide_res.status_code == 200
    assert hide_res.json()["data"]["status"] == "HIDDEN"

    # Verify public product reviews exclude hidden review
    pub_revs = await client.get(f"/api/v1/products/{prod_id}/reviews")
    assert pub_revs.status_code == 200
    assert len(pub_revs.json()["data"]["items"]) == 0
    # Rating metrics should now reflect 0 active reviews
    assert pub_revs.json()["data"]["total"] == 0
    assert pub_revs.json()["data"]["reviewCount"] == 0


# ==============================================================================
# 7. In-App Notifications Lifecycle (Read, Mark All Read)
# ==============================================================================

@pytest.mark.asyncio
async def test_notifications_lifecycle(client: AsyncClient) -> None:
    cust_token, _ = await register_customer(client, "NotifCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Initial count
    cnt_res = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert cnt_res.status_code == 200
    assert "unreadCount" in cnt_res.json()["data"]

    # 2. Mark all read
    mark_all = await client.post("/api/v1/notifications/read-all", headers=headers)
    assert mark_all.status_code == 200
    assert "markedReadCount" in mark_all.json()["data"]

    # 3. Verify unread count is now 0
    cnt_after = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert cnt_after.status_code == 200
    assert cnt_after.json()["data"]["unreadCount"] == 0


# ==============================================================================
# 8. Domain Event Outbox Emission
# ==============================================================================

@pytest.mark.asyncio
async def test_domain_event_outbox(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "EventAgent")
    prod = await create_published_product(client, agent_token, title="Event Phone", price=30000, stock=5)
    prod_id = prod["id"]

    cust_token, _ = await register_customer(client, "EventCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # Add watchlist
    await client.post(
        "/api/v1/watchlist",
        json={"productId": prod_id, "watchPriceDrop": True},
        headers=headers,
    )

    # Agent triggers price change
    await client.put(
        f"/api/v1/agent/products/{prod_id}",
        json={"basePrice": 25000},
        headers={"Authorization": f"Bearer {agent_token}"},
    )

    # Verify outbox records directly in database session
    from app.db.session import async_session_factory
    session_maker = async_session_factory()
    async with session_maker() as session:
        stmt = select(DomainEvent).where(DomainEvent.entity_id == prod_id)
        events = (await session.execute(stmt)).scalars().all()
        assert len(events) >= 1
        event_types = [e.event_type for e in events]
        assert "product.price_dropped" in event_types
