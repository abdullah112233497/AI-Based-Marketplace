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


@pytest.mark.asyncio
async def test_get_categories(client: AsyncClient) -> None:
    res = await client.get("/api/v1/categories")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 3
    slugs = [c["slug"] for c in body["data"]]
    assert "mobiles" in slugs
    assert "laptops" in slugs
    assert "accessories" in slugs


@pytest.mark.asyncio
async def test_get_category_specs(client: AsyncClient) -> None:
    res = await client.get("/api/v1/categories/mobiles/specs")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["slug"] == "mobiles"
    assert "fields" in data
    field_keys = [f["key"] for f in data["fields"]]
    assert "ram_gb" in field_keys
    assert "storage_gb" in field_keys

    # Nonexistent category 404
    bad_res = await client.get("/api/v1/categories/nonexistent-category-slug/specs")
    assert bad_res.status_code == 404
    assert bad_res.json()["error"]["code"] == "CATEGORY_NOT_FOUND"


@pytest.mark.asyncio
async def test_agent_product_crud_and_ownership(client: AsyncClient) -> None:
    # 1. Setup two distinct approved agents
    agent_a_token, agent_a_id, _ = await create_and_approve_agent(client, "AgentA")
    agent_b_token, agent_b_id, _ = await create_and_approve_agent(client, "AgentB")

    # 2. Customer cannot create product
    cust_res = await client.post("/api/v1/auth/register", json={
        "name": "Customer Guy",
        "email": f"cust_{uuid.uuid4().hex[:8]}@test.com",
        "phone": "03009999999",
        "password": "Password123!",
    })
    cust_token = cust_res.json()["data"]["token"]
    forbidden_create = await client.post(
        "/api/v1/agent/products",
        json={
            "title": "Hacker Phone",
            "description": "Unauthorized listing attempt",
            "categoryId": "mobiles",
            "brand": "Apple",
            "condition": "NEW",
            "basePrice": 150000,
            "stock": 5,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {"ram_gb": "8", "storage_gb": "256"},
        },
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert forbidden_create.status_code == 403

    # 3. Agent A creates valid product
    create_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": f"Flagship Test Phone {uuid.uuid4().hex[:6]}",
            "description": "Premium flagship test phone with warranty",
            "categoryId": "mobiles",
            "brand": "Apple",
            "condition": "NEW",
            "basePrice": 350000,
            "stock": 10,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {"ram_gb": "12", "storage_gb": "256", "pta_approved": "Official PTA Approved"},
        },
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert create_res.status_code == 201
    prod_data = create_res.json()["data"]
    prod_id = prod_data["id"]
    prod_slug = prod_data["slug"]
    assert prod_data["agentId"] == agent_a_id
    assert prod_data["basePrice"] == 350000

    # 4. Agent A lists own products -> includes new product
    list_res = await client.get(
        "/api/v1/agent/products",
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert list_res.status_code == 200
    my_products = list_res.json()["data"]
    assert any(p["id"] == prod_id for p in my_products)

    # 5. Agent B attempts to update Agent A's product -> 403 Forbidden
    cross_edit_res = await client.patch(
        f"/api/v1/agent/products/{prod_id}",
        json={"basePrice": 1000},
        headers={"Authorization": f"Bearer {agent_b_token}"},
    )
    assert cross_edit_res.status_code == 403
    assert cross_edit_res.json()["error"]["code"] == "FORBIDDEN"

    # 6. Agent A updates own product
    update_res = await client.patch(
        f"/api/v1/agent/products/{prod_id}",
        json={"basePrice": 340000, "stock": 8},
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["basePrice"] == 340000
    assert update_res.json()["data"]["stock"] == 8

    # 7. Agent B attempts to delete Agent A's product -> 403 Forbidden
    cross_delete_res = await client.delete(
        f"/api/v1/agent/products/{prod_id}",
        headers={"Authorization": f"Bearer {agent_b_token}"},
    )
    assert cross_delete_res.status_code == 403
    assert cross_delete_res.json()["error"]["code"] == "FORBIDDEN"

    # 8. Agent A archives/deletes own product
    delete_res = await client.delete(
        f"/api/v1/agent/products/{prod_id}",
        headers={"Authorization": f"Bearer {agent_a_token}"},
    )
    assert delete_res.status_code == 200
    assert delete_res.json()["data"]["status"] == "ARCHIVED"

    # 9. Verify archived product is no longer returned in public catalog detail
    public_res = await client.get(f"/api/v1/products/{prod_slug}")
    assert public_res.status_code == 404


@pytest.mark.asyncio
async def test_spec_validation_enforcement(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "Validator")

    # Invalid spec: option not allowed
    bad_spec_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": "Invalid Specs Phone",
            "description": "Invalid spec values testing",
            "categoryId": "mobiles",
            "brand": "Apple",
            "condition": "NEW",
            "basePrice": 200000,
            "stock": 5,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {"pta_approved": "Invalid Option That Does Not Exist"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert bad_spec_res.status_code == 422
    assert bad_spec_res.json()["error"]["code"] == "INVALID_SPECS"

    # Invalid price: negative or zero
    bad_price_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": "Zero Price Phone",
            "description": "Invalid price test",
            "categoryId": "mobiles",
            "brand": "Apple",
            "condition": "NEW",
            "basePrice": 0,
            "stock": 5,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert bad_price_res.status_code == 422


@pytest.mark.asyncio
async def test_public_catalog_filtering_and_search(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "CatalogSearch")
    unique_tag = uuid.uuid4().hex[:6]

    # Product 1: High-end Mobile
    p1_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": f"ProUltra_{unique_tag} Phone 512GB",
            "description": "Top tier device with ultra fast performance",
            "categoryId": "mobiles",
            "brand": "Samsung",
            "condition": "NEW",
            "basePrice": 420000,
            "stock": 10,
            "images": ["https://images.unsplash.com/test1.jpg"],
            "specs": {"ram_gb": "12", "storage_gb": "512"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert p1_res.status_code == 201

    # Product 2: Budget Mobile
    p2_res = await client.post(
        "/api/v1/agent/products",
        json={
            "title": f"BudgetLite_{unique_tag} Phone 128GB",
            "description": "Affordable daily driver smartphone",
            "categoryId": "mobiles",
            "brand": "Xiaomi",
            "condition": "USED",
            "basePrice": 85000,
            "stock": 15,
            "images": ["https://images.unsplash.com/test2.jpg"],
            "specs": {"ram_gb": "6", "storage_gb": "128"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert p2_res.status_code == 201

    # 1. Search by title keyword
    search_res = await client.get(f"/api/v1/products?search={unique_tag}")
    assert search_res.status_code == 200
    items = search_res.json()["data"]
    assert len(items) == 2

    # 2. Filter by brand
    brand_res = await client.get(f"/api/v1/products?search={unique_tag}&brand=Samsung")
    assert brand_res.status_code == 200
    brand_items = brand_res.json()["data"]
    assert len(brand_items) == 1
    assert brand_items[0]["brand"] == "Samsung"

    # 3. Dynamic spec filter (ram_gb=12)
    spec_res = await client.get(f"/api/v1/products?search={unique_tag}&ram_gb=12")
    assert spec_res.status_code == 200
    spec_items = spec_res.json()["data"]
    assert len(spec_items) == 1
    assert spec_items[0]["specs"]["ram_gb"] == "12"

    # 4. Price range filter
    price_res = await client.get(f"/api/v1/products?search={unique_tag}&minPrice=100000")
    assert price_res.status_code == 200
    price_items = price_res.json()["data"]
    assert len(price_items) == 1
    assert price_items[0]["basePrice"] == 420000

    # 5. Sorting
    sort_res = await client.get(f"/api/v1/products?search={unique_tag}&sort=price_desc")
    assert sort_res.status_code == 200
    sorted_items = sort_res.json()["data"]
    assert len(sorted_items) == 2
    assert sorted_items[0]["basePrice"] > sorted_items[1]["basePrice"]


@pytest.mark.asyncio
async def test_product_detail_and_compare(client: AsyncClient) -> None:
    agent_token, _, _ = await create_and_approve_agent(client, "CompareAgent")

    p1 = (await client.post(
        "/api/v1/agent/products",
        json={
            "title": f"CompareDev1 {uuid.uuid4().hex[:6]}",
            "description": "Comparison test item one",
            "categoryId": "mobiles",
            "brand": "Apple",
            "condition": "NEW",
            "basePrice": 300000,
            "stock": 5,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {"ram_gb": "8"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )).json()["data"]

    p2 = (await client.post(
        "/api/v1/agent/products",
        json={
            "title": f"CompareDev2 {uuid.uuid4().hex[:6]}",
            "description": "Comparison test item two",
            "categoryId": "mobiles",
            "brand": "Samsung",
            "condition": "NEW",
            "basePrice": 280000,
            "stock": 4,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {"ram_gb": "12"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )).json()["data"]

    # 1. Product detail by slug
    detail_res = await client.get(f"/api/v1/products/{p1['slug']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert detail["id"] == p1["id"]
    assert "agent" in detail
    assert "category" in detail
    assert "related" in detail

    # 2. Product comparison by IDs
    compare_res = await client.get(f"/api/v1/products/compare?ids={p1['id']},{p2['id']}")
    assert compare_res.status_code == 200
    comp_list = compare_res.json()["data"]
    assert len(comp_list) == 2
    comp_ids = [c["id"] for c in comp_list]
    assert p1["id"] in comp_ids
    assert p2["id"] in comp_ids


@pytest.mark.asyncio
async def test_public_agent_directory_and_shop(client: AsyncClient) -> None:
    agent_token, agent_id, agent_profile = await create_and_approve_agent(client, "PublicShop")

    # Create a published product for this agent
    await client.post(
        "/api/v1/agent/products",
        json={
            "title": f"Shop Product {uuid.uuid4().hex[:6]}",
            "description": "Product belonging to verified public agent",
            "categoryId": "mobiles",
            "brand": "Google",
            "condition": "NEW",
            "basePrice": 180000,
            "stock": 6,
            "images": ["https://images.unsplash.com/test.jpg"],
            "specs": {"ram_gb": "8"},
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )

    # 1. Public directory contains this agent
    dir_res = await client.get("/api/v1/agents/directory")
    assert dir_res.status_code == 200
    agents = dir_res.json()["data"]
    assert any(a["id"] == agent_id for a in agents)

    # 2. Public shop query by agent slug
    shop_slug = agent_profile.get("slug") or agent_profile.get("shopSlug")
    shop_res = await client.get(f"/api/v1/agents/public/{shop_slug}")
    assert shop_res.status_code == 200
    shop_data = shop_res.json()["data"]
    assert shop_data["id"] == agent_id
    assert "products" in shop_data
    assert len(shop_data["products"]) >= 1

    # 3. Nonexistent agent slug returns 404
    bad_shop = await client.get("/api/v1/agents/public/nonexistent-agent-slug-1234")
    assert bad_shop.status_code == 404
    assert bad_shop.json()["error"]["code"] == "AGENT_NOT_FOUND"
