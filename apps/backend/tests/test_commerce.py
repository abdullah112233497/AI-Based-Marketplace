import uuid
import pytest
from httpx import AsyncClient

ADMIN_CREDENTIALS = {
    "email": "admin@techmarketplace.pk",
    "password": "Admin123!",
}


async def get_admin_token(client: AsyncClient) -> str:
    res = await client.post("/api/v1/auth/login", json=ADMIN_CREDENTIALS)
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["data"]["token"]


async def create_and_approve_agent(client: AsyncClient, name_prefix: str = "Vendor") -> tuple[str, str, dict]:
    """Helper to create and approve an agent, returning (token, agent_id, profile)."""
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
    """Helper to register a customer, returning (token, user_id)."""
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
    """Helper to create and publish an in-stock product."""
    create_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": title,
            "description": f"Detailed description for {title}",
            "categoryId": category_slug,
            "brand": "Apple",
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


@pytest.mark.asyncio
async def test_cart_crud_lifecycle(client: AsyncClient) -> None:
    # 1. Setup agent & published product
    agent_token, _, _ = await create_and_approve_agent(client, "CartAgent")
    prod = await create_published_product(client, agent_token, title="Gaming Phone", price=80000, stock=5)
    prod_id = prod["id"]

    # 2. Setup customer
    cust_token, _ = await register_customer(client, "CartCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Initially cart is empty
    cart_res = await client.get("/api/v1/cart", headers=headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()["data"]
    assert cart_data["totalItems"] == 0
    assert len(cart_data["items"]) == 0

    # 4. Add item to cart
    add_res = await client.post(
        "/api/v1/cart/items",
        json={"productId": prod_id, "quantity": 2},
        headers=headers,
    )
    assert add_res.status_code in (200, 201)
    cart = add_res.json()["data"]
    assert cart["totalItems"] == 2
    assert cart["subtotal"] == 160000
    assert len(cart["items"]) == 1
    item_id = cart["items"][0]["id"]
    assert cart["items"][0]["quantity"] == 2

    # 5. Update quantity
    update_res = await client.patch(
        f"/api/v1/cart/items/{item_id}",
        json={"quantity": 3},
        headers=headers,
    )
    assert update_res.status_code == 200
    cart = update_res.json()["data"]
    assert cart["totalItems"] == 3
    assert cart["subtotal"] == 240000

    # 6. Exceeding stock is rejected
    exceed_res = await client.patch(
        f"/api/v1/cart/items/{item_id}",
        json={"quantity": 10},
        headers=headers,
    )
    assert exceed_res.status_code == 400
    assert "INSUFFICIENT_STOCK" in exceed_res.json()["error"]["code"]

    # 7. Delete item
    del_res = await client.delete(f"/api/v1/cart/items/{item_id}", headers=headers)
    assert del_res.status_code == 200
    cart = del_res.json()["data"]
    assert cart["totalItems"] == 0
    assert len(cart["items"]) == 0

    # 8. Add again and test clear cart
    add_re = await client.post("/api/v1/cart/items", json={"productId": prod_id, "quantity": 1}, headers=headers)
    assert add_re.status_code in (200, 201)
    clear_res = await client.delete("/api/v1/cart", headers=headers)
    assert clear_res.status_code == 200
    assert clear_res.json()["data"]["totalItems"] == 0


@pytest.mark.asyncio
async def test_order_preview_calculation(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "PrevAgent")
    prod = await create_published_product(client, agent_token, title="Laptop X", price=150000, stock=3)

    cust_token, _ = await register_customer(client, "PrevCustomer")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # Order preview for 2 units
    preview_res = await client.post(
        "/api/v1/orders/preview",
        json={
            "items": [{"productId": prod["id"], "quantity": 2}],
            "useWallet": False,
        },
        headers=headers,
    )
    assert preview_res.status_code == 200
    prev_data = preview_res.json()["data"]
    assert prev_data["subtotal"] == 300000
    assert prev_data["shippingFee"] == 500
    assert prev_data["walletDiscount"] == 0
    assert prev_data["totalAmount"] == 300500
    assert prev_data["estimatedReward"] == int(300000 * 0.02)  # 2% cashback


@pytest.mark.asyncio
async def test_checkout_atomic_order_creation_and_inventory(client: AsyncClient) -> None:
    agent_token, agent_id, _ = await create_and_approve_agent(client, "CheckoutAgent")
    prod = await create_published_product(client, agent_token, title="Flagship Ultra", price=100000, stock=5)
    prod_id = prod["id"]

    cust_token, cust_id = await register_customer(client, "CheckoutCustomer")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Add to cart first
    await client.post(
        "/api/v1/cart/items",
        json={"productId": prod_id, "quantity": 2},
        headers=cust_headers,
    )

    # Place order via checkout
    order_res = await client.post(
        "/api/v1/orders",
        json={
            "shippingAddress": {
                "fullName": "Muhammad Saad Raza",
                "phone": "03001234567",
                "streetAddress": "Main Boulevard Gulberg",
                "city": "Lahore",
                "province": "Punjab",
                "postalCode": "54000",
            },
            "paymentMethod": "COD",
            "notes": "Please deliver after 2 PM",
            "useWallet": False,
        },
        headers=cust_headers,
    )
    assert order_res.status_code == 201, f"Order creation failed: {order_res.text}"
    order = order_res.json()["data"]
    order_id = order["id"]
    order_number = order["orderNumber"]
    assert order_number.startswith(("ORD-", "TM-"))
    assert order["status"] == "PENDING"
    assert order["subtotal"] == 200000
    assert order["shippingFee"] == 500
    assert order["totalAmount"] == 200500
    assert len(order["items"]) == 1

    # Verify inventory was atomically decremented from 5 to 3
    prod_check = await client.get(f"/api/v1/products/{prod['slug']}")
    assert prod_check.status_code == 200
    assert prod_check.json()["data"]["stock"] == 3

    # Verify cart was cleared
    cart_check = await client.get("/api/v1/cart", headers=cust_headers)
    assert cart_check.json()["data"]["totalItems"] == 0

    # Customer can fetch order by ID or order number
    fetch_res = await client.get(f"/api/v1/orders/{order_number}", headers=cust_headers)
    assert fetch_res.status_code == 200
    assert fetch_res.json()["data"]["id"] == order_id


@pytest.mark.asyncio
async def test_agent_order_fulfillment_lifecycle(client: AsyncClient) -> None:
    # 1. Two separate agents
    agent_a_token, agent_a_id, _ = await create_and_approve_agent(client, "VendorA")
    agent_b_token, agent_b_id, _ = await create_and_approve_agent(client, "VendorB")

    prod_a = await create_published_product(client, agent_a_token, title="Phone A", price=40000, stock=4)

    # 2. Customer orders product A
    cust_token, _ = await register_customer(client, "Buyer")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    await client.post("/api/v1/cart/items", json={"productId": prod_a["id"], "quantity": 1}, headers=cust_headers)
    create_order = await client.post(
        "/api/v1/orders",
        json={
            "shippingAddress": {
                "fullName": "Buyer Test",
                "phone": "03001112233",
                "streetAddress": "Street 1",
                "city": "Karachi",
                "province": "Sindh",
                "postalCode": "75000",
            },
            "paymentMethod": "COD",
        },
        headers=cust_headers,
    )
    assert create_order.status_code == 201
    order_id = create_order.json()["data"]["id"]

    # 3. Agent A sees the order in /api/v1/agent/orders
    a_orders_res = await client.get("/api/v1/agent/orders", headers={"Authorization": f"Bearer {agent_a_token}"})
    assert a_orders_res.status_code == 200
    a_orders = a_orders_res.json()["data"]
    order_ids_for_a = [o["id"] for o in a_orders]
    assert order_id in order_ids_for_a

    # 4. Multi-tenant isolation: Agent B cannot see Agent A's order
    b_orders_res = await client.get("/api/v1/agent/orders", headers={"Authorization": f"Bearer {agent_b_token}"})
    assert b_orders_res.status_code == 200
    order_ids_for_b = [o["id"] for o in b_orders_res.json()["data"]]
    assert order_id not in order_ids_for_b

    # Agent B cannot modify Agent A's order status (404/403)
    b_hack = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "CONFIRMED"},
        headers={"Authorization": f"Bearer {agent_b_token}"},
    )
    assert b_hack.status_code in (403, 404)

    # 5. Agent A advances status: PENDING -> CONFIRMED -> SHIPPED -> DELIVERED
    step1 = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "CONFIRMED"},
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert step1.status_code == 200
    assert step1.json()["data"]["status"] == "CONFIRMED"

    step2 = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "SHIPPED"},
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert step2.status_code == 200
    assert step2.json()["data"]["status"] == "SHIPPED"

    step3 = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "DELIVERED"},
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert step3.status_code == 200
    delivered_data = step3.json()["data"]
    assert delivered_data["status"] == "DELIVERED"
    assert delivered_data["paymentStatus"] == "PAID"
    assert delivered_data["rewardCredited"] is True

    # 6. Invalid transition rejection: cannot transition backwards from DELIVERED to PENDING
    invalid_step = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "PENDING"},
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert invalid_step.status_code == 400
    assert "INVALID_STATUS_TRANSITION" in invalid_step.json()["error"]["code"]

    # 7. Customer received 2% cashback in wallet
    wallet_res = await client.get("/api/v1/customer/wallet", headers=cust_headers)
    assert wallet_res.status_code == 200
    wallet = wallet_res.json()["data"]
    expected_reward = int(40000 * 0.02)  # 800 PKR
    assert wallet["balance"] == expected_reward
    assert len(wallet["ledger"]) == 1
    assert wallet["ledger"][0]["amount"] == expected_reward
    assert wallet["ledger"][0]["transactionType"] == "EARNED"

    # 8. Idempotency test: repeating DELIVERED does not grant duplicate cashback
    step3_repeat = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "DELIVERED"},
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert step3_repeat.status_code == 200
    wallet_res_again = await client.get("/api/v1/customer/wallet", headers=cust_headers)
    assert wallet_res_again.json()["data"]["balance"] == expected_reward


@pytest.mark.asyncio
async def test_order_cancellation_and_inventory_restoration(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "CancelVendor")
    prod = await create_published_product(client, agent_token, title="Phone Cancel Test", price=30000, stock=10)
    prod_id = prod["id"]

    cust_token, _ = await register_customer(client, "Canceller")
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Order 3 items (stock drops from 10 to 7)
    await client.post("/api/v1/cart/items", json={"productId": prod_id, "quantity": 3}, headers=cust_headers)
    order_res = await client.post(
        "/api/v1/orders",
        json={
            "shippingAddress": {
                "fullName": "Cancel Buyer",
                "phone": "03001234567",
                "streetAddress": "Street 9",
                "city": "Islamabad",
                "province": "ICT",
                "postalCode": "44000",
            },
            "paymentMethod": "COD",
        },
        headers=cust_headers,
    )
    order_id = order_res.json()["data"]["id"]

    prod_check = await client.get(f"/api/v1/products/{prod['slug']}")
    assert prod_check.json()["data"]["stock"] == 7

    # Cancel order: stock must be restored back to 10
    cancel_res = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "CANCELLED"},
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "CANCELLED"

    prod_check_restored = await client.get(f"/api/v1/products/{prod['slug']}")
    assert prod_check_restored.json()["data"]["stock"] == 10

    # Idempotent: repeating CANCELLED does not restore stock twice
    cancel_repeat = await client.patch(
        f"/api/v1/agent/orders/{order_id}/status",
        json={"status": "CANCELLED"},
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert cancel_repeat.status_code == 200
    prod_check_restored_2 = await client.get(f"/api/v1/products/{prod['slug']}")
    assert prod_check_restored_2.json()["data"]["stock"] == 10


@pytest.mark.asyncio
async def test_admin_commission_rules_and_records(client: AsyncClient) -> None:
    admin_token = await get_admin_token(client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Fetch commission rules
    rules_res = await client.get("/api/v1/admin/commission", headers=admin_headers)
    assert rules_res.status_code == 200
    rules = rules_res.json()["data"]
    assert len(rules) >= 3

    # 2. Update a category commission rate (e.g. mobiles to 6.0%)
    update_res = await client.put(
        "/api/v1/admin/commission",
        json={"categorySlug": "mobiles", "percentage": 6.0},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["percentage"] == 6.0

    # 3. Non-admin (customer or agent) cannot update commission rules
    cust_token, _ = await register_customer(client, "RbacTest")
    hack_res = await client.put(
        "/api/v1/admin/commission",
        json={"categorySlug": "mobiles", "percentage": 1.0},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert hack_res.status_code == 403
