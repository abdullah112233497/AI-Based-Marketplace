import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.models.agent import Agent, AgentStatus
from app.db.models.brand import Brand
from app.db.models.category import Category
from app.db.models.product import Product, ProductCondition, ProductStatus
from app.db.models.user import User, UserRole
from app.db.session import async_session_factory
from app.utils.slug import slugify


CATEGORY_SPECS = {
    "mobiles": {
        "categoryId": "mobiles",
        "categoryName": "Mobiles",
        "fields": [
            {"key": "ram_gb", "label": "RAM", "type": "select", "unit": "GB", "options": ["4", "6", "8", "12", "16", "24"], "required": True, "filterable": True, "comparable": True},
            {"key": "storage_gb", "label": "Storage", "type": "select", "unit": "GB", "options": ["64", "128", "256", "512", "1024"], "required": True, "filterable": True, "comparable": True},
            {"key": "battery_mah", "label": "Battery", "type": "number", "unit": "mAh", "required": True, "filterable": True, "comparable": True, "placeholder": "e.g. 5000"},
            {"key": "screen_size_inch", "label": "Screen Size", "type": "number", "unit": "inches", "required": True, "filterable": True, "comparable": True, "placeholder": "e.g. 6.7"},
            {"key": "camera_mp", "label": "Main Camera", "type": "text", "unit": "MP", "required": True, "filterable": True, "comparable": True, "placeholder": "e.g. 50 MP + 12 MP"},
            {"key": "chipset", "label": "Chipset / Processor", "type": "text", "required": True, "filterable": True, "comparable": True, "placeholder": "e.g. Snapdragon 8 Gen 3"},
            {"key": "network", "label": "Network Support", "type": "select", "options": ["4G LTE", "5G"], "required": True, "filterable": True, "comparable": True},
            {"key": "pta_approved", "label": "PTA Status", "type": "select", "options": ["Official PTA Approved", "Non-PTA", "CPID / Patch"], "required": True, "filterable": True, "comparable": True},
        ],
    },
    "laptops": {
        "categoryId": "laptops",
        "categoryName": "Laptops",
        "fields": [
            {"key": "cpu", "label": "Processor (CPU)", "type": "text", "required": True, "filterable": True, "comparable": True, "placeholder": "e.g. Intel Core i7-14700H / Apple M3"},
            {"key": "ram_gb", "label": "RAM", "type": "select", "unit": "GB", "options": ["8", "16", "32", "64"], "required": True, "filterable": True, "comparable": True},
            {"key": "storage_gb", "label": "SSD Storage", "type": "select", "unit": "GB", "options": ["256", "512", "1024", "2048"], "required": True, "filterable": True, "comparable": True},
            {"key": "gpu", "label": "Graphics Card (GPU)", "type": "text", "required": False, "filterable": True, "comparable": True, "placeholder": "e.g. RTX 4070 8GB / Integrated"},
            {"key": "screen_size_inch", "label": "Display Size", "type": "select", "unit": "inches", "options": ["13.3", "14.0", "15.6", "16.0", "17.3"], "required": True, "filterable": True, "comparable": True},
            {"key": "screen_refresh_rate", "label": "Refresh Rate", "type": "select", "unit": "Hz", "options": ["60", "120", "144", "165", "240"], "required": False, "filterable": True, "comparable": True},
            {"key": "weight_kg", "label": "Weight", "type": "number", "unit": "kg", "required": False, "filterable": False, "comparable": True, "placeholder": "e.g. 1.6"},
        ],
    },
    "accessories": {
        "categoryId": "accessories",
        "categoryName": "Accessories & Wearables",
        "fields": [
            {"key": "accessory_type", "label": "Accessory Type", "type": "select", "options": ["Smartwatch", "Earbuds / Headphones", "Power Bank", "Charger & Cable", "Keyboard / Mouse"], "required": True, "filterable": True, "comparable": True},
            {"key": "connectivity", "label": "Connectivity", "type": "select", "options": ["Bluetooth", "Wireless 2.4GHz", "Wired Type-C", "Wired Lightning"], "required": True, "filterable": True, "comparable": True},
            {"key": "battery_life_hours", "label": "Battery Life", "type": "number", "unit": "hours", "required": False, "filterable": True, "comparable": True, "placeholder": "e.g. 30"},
            {"key": "warranty_months", "label": "Warranty Duration", "type": "select", "unit": "months", "options": ["No Warranty", "1 Month", "3 Months", "6 Months", "12 Months"], "required": True, "filterable": True, "comparable": True},
        ],
    },
}


async def seed_catalog_data() -> None:
    session_factory = async_session_factory()
    async with session_factory() as session:
        # ==============================================================================
        # 1. Categories
        # ==============================================================================
        categories_map = {}
        category_defs = [
            {
                "slug": "mobiles",
                "name": "Mobiles & Tablets",
                "description": "Flagship smartphones, iPads, PTA approved phones & 5G devices",
                "icon": "Smartphone",
                "sort_order": 1,
                "spec_schema": CATEGORY_SPECS["mobiles"],
            },
            {
                "slug": "laptops",
                "name": "Laptops & Computers",
                "description": "MacBooks, RTX Gaming rigs, Ultrabooks & Workstations",
                "icon": "Laptop",
                "sort_order": 2,
                "spec_schema": CATEGORY_SPECS["laptops"],
            },
            {
                "slug": "accessories",
                "name": "Audio & Wearables",
                "description": "Wireless earbuds, smartwatches, power banks & studio headphones",
                "icon": "Headphones",
                "sort_order": 3,
                "spec_schema": CATEGORY_SPECS["accessories"],
            },
        ]

        for cat_def in category_defs:
            stmt = select(Category).where(Category.slug == cat_def["slug"])
            cat = (await session.execute(stmt)).scalar_one_or_none()
            if not cat:
                cat = Category(
                    name=cat_def["name"],
                    slug=cat_def["slug"],
                    description=cat_def["description"],
                    icon=cat_def["icon"],
                    sort_order=cat_def["sort_order"],
                    spec_schema=cat_def["spec_schema"],
                    is_active=True,
                )
                session.add(cat)
                await session.flush()
                print(f"[+] Seeded category: {cat.name}")
            else:
                cat.spec_schema = cat_def["spec_schema"]
                print(f"[*] Category already exists: {cat.name}")
            categories_map[cat.slug] = cat

        # ==============================================================================
        # 2. Brands
        # ==============================================================================
        brand_names = ["Apple", "Samsung", "Google", "Dell", "Lenovo", "Sony", "Xiaomi", "Asus", "HP"]
        brands_map = {}
        for b_name in brand_names:
            b_slug = slugify(b_name)
            stmt = select(Brand).where(Brand.slug == b_slug)
            brand = (await session.execute(stmt)).scalar_one_or_none()
            if not brand:
                brand = Brand(name=b_name, slug=b_slug, is_active=True)
                session.add(brand)
                await session.flush()
                print(f"[+] Seeded brand: {brand.name}")
            brands_map[b_name.lower()] = brand

        # ==============================================================================
        # 3. Approved Agents
        # ==============================================================================
        # Agent 1: TechZone Lahore
        stmt_agent1 = select(Agent).join(User).where(User.email == "lahore@techzone.pk")
        agent1 = (await session.execute(stmt_agent1)).scalar_one_or_none()
        if not agent1:
            pwd_hash = hash_password("Admin123!")
            u1 = User(
                name="Bilal Farooq",
                email="lahore@techzone.pk",
                phone="03009876543",
                password_hash=pwd_hash,
                role=UserRole.AGENT,
                is_active=True,
                is_verified=True,
            )
            session.add(u1)
            await session.flush()
            agent1 = Agent(
                user_id=u1.id,
                shop_name="TechZone Hafeez Centre",
                shop_slug="techzone-lahore",
                shop_description="Hafeez Centre Lahore's flagship multi-vendor mobile & laptop store.",
                city="Lahore",
                address="Shop 42, 2nd Floor, Hafeez Centre, Main Boulevard, Gulberg III, Lahore",
                contact_phone="03009876543",
                status=AgentStatus.APPROVED,
                is_verified=True,
                rating=4.9,
                rating_count=38,
                product_count=0,
            )
            session.add(agent1)
            await session.flush()
            print("[+] Seeded Agent: TechZone Lahore")

        # Agent 2: Capital Tech Hub Islamabad
        stmt_agent2 = select(Agent).join(User).where(User.email == "islamabad@capitaltech.pk")
        agent2 = (await session.execute(stmt_agent2)).scalar_one_or_none()
        if not agent2:
            pwd_hash = hash_password("Admin123!")
            u2 = User(
                name="Hamza Abbasi",
                email="islamabad@capitaltech.pk",
                phone="03335551234",
                password_hash=pwd_hash,
                role=UserRole.AGENT,
                is_active=True,
                is_verified=True,
            )
            session.add(u2)
            await session.flush()
            agent2 = Agent(
                user_id=u2.id,
                shop_name="Capital Tech Hub Blue Area",
                shop_slug="capital-tech-hub-islamabad",
                shop_description="Beverly Centre Blue Area Islamabad premier hardware and gadgets supplier.",
                city="Islamabad",
                address="Beverly Centre, Jinnah Avenue, Blue Area, Islamabad",
                contact_phone="03335551234",
                status=AgentStatus.APPROVED,
                is_verified=True,
                rating=5.0,
                rating_count=24,
                product_count=0,
            )
            session.add(agent2)
            await session.flush()
            print("[+] Seeded Agent: Capital Tech Hub Islamabad")

        # ==============================================================================
        # 4. Realistic Products (20 products)
        # ==============================================================================
        product_seeds = [
            # Mobiles
            {
                "title": "Samsung Galaxy S24 Ultra 512GB (Titanium Gray)",
                "slug": "samsung-galaxy-s24-ultra-512gb-gray",
                "description": "Galaxy AI flagship smartphone featuring Snapdragon 8 Gen 3, titanium armor frame, built-in S Pen, and 200MP Quad Telephoto Camera system. Official PTA Approved with 1-Year Local Samsung Brand Warranty.",
                "category_slug": "mobiles",
                "brand_name": "Samsung",
                "condition": ProductCondition.NEW,
                "base_price": 389999,
                "compare_at_price": 420000,
                "stock": 14,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80",
                    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80",
                ],
                "specs": {
                    "ram_gb": "12",
                    "storage_gb": "512",
                    "battery_mah": 5000,
                    "screen_size_inch": 6.8,
                    "camera_mp": "200 MP + 50 MP + 12 MP",
                    "chipset": "Snapdragon 8 Gen 3 for Galaxy",
                    "network": "5G",
                    "pta_approved": "Official PTA Approved",
                },
            },
            {
                "title": "Apple iPhone 16 Pro Max 256GB (Natural Titanium)",
                "slug": "apple-iphone-16-pro-max-256gb-titanium",
                "description": "Featuring Grade 5 Titanium design with the all-new Camera Control button, A18 Pro chip, 48MP Fusion camera with 5x telephoto zoom, and unmatched battery endurance. Official PTA Approved.",
                "category_slug": "mobiles",
                "brand_name": "Apple",
                "condition": ProductCondition.NEW,
                "base_price": 485000,
                "compare_at_price": 510000,
                "stock": 9,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80",
                    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80",
                ],
                "specs": {
                    "ram_gb": "8",
                    "storage_gb": "256",
                    "battery_mah": 4685,
                    "screen_size_inch": 6.9,
                    "camera_mp": "48 MP + 48 MP + 12 MP",
                    "chipset": "Apple A18 Pro (3nm)",
                    "network": "5G",
                    "pta_approved": "Official PTA Approved",
                },
            },
            {
                "title": "Google Pixel 9 Pro XL 128GB (Obsidian Black)",
                "slug": "google-pixel-9-pro-xl-128gb-obsidian",
                "description": "Gemini Nano AI on-device with Tensor G4 processor. 50MP triple pro camera, Super Actua display, and 7 years of OS updates. Official PTA Approved.",
                "category_slug": "mobiles",
                "brand_name": "Google",
                "condition": ProductCondition.NEW,
                "base_price": 315000,
                "compare_at_price": 340000,
                "stock": 6,
                "agent": agent2,
                "images": [
                    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80",
                ],
                "specs": {
                    "ram_gb": "16",
                    "storage_gb": "128",
                    "battery_mah": 5060,
                    "screen_size_inch": 6.8,
                    "camera_mp": "50 MP + 48 MP + 48 MP",
                    "chipset": "Google Tensor G4 (4nm)",
                    "network": "5G",
                    "pta_approved": "Official PTA Approved",
                },
            },
            {
                "title": "Samsung Galaxy S23 Ultra 256GB (Phantom Black) - Pre-Owned",
                "slug": "samsung-galaxy-s23-ultra-256gb-used",
                "description": "Certified Grade-A pre-owned Galaxy S23 Ultra. 200MP camera, Snapdragon 8 Gen 2, pristine condition with 10-day testing warranty. Official PTA Approved.",
                "category_slug": "mobiles",
                "brand_name": "Samsung",
                "condition": ProductCondition.USED,
                "base_price": 225000,
                "compare_at_price": 245000,
                "stock": 3,
                "agent": agent2,
                "images": [
                    "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80",
                ],
                "specs": {
                    "ram_gb": "8",
                    "storage_gb": "256",
                    "battery_mah": 5000,
                    "screen_size_inch": 6.8,
                    "camera_mp": "200 MP + 12 MP + 10 MP",
                    "chipset": "Snapdragon 8 Gen 2",
                    "network": "5G",
                    "pta_approved": "Official PTA Approved",
                },
            },
            {
                "title": "Xiaomi 14 Ultra 512GB (Leica Quad Lens Edition)",
                "slug": "xiaomi-14-ultra-512gb-leica",
                "description": "Photography powerhouse with 1-inch Sony LYT-900 sensor and quad Leica lenses. Snapdragon 8 Gen 3 and 90W fast charging. Official PTA Approved.",
                "category_slug": "mobiles",
                "brand_name": "Xiaomi",
                "condition": ProductCondition.NEW,
                "base_price": 298000,
                "compare_at_price": 320000,
                "stock": 5,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
                ],
                "specs": {
                    "ram_gb": "16",
                    "storage_gb": "512",
                    "battery_mah": 5000,
                    "screen_size_inch": 6.7,
                    "camera_mp": "50 MP + 50 MP + 50 MP + 50 MP",
                    "chipset": "Snapdragon 8 Gen 3",
                    "network": "5G",
                    "pta_approved": "Official PTA Approved",
                },
            },

            # Laptops
            {
                "title": "Apple MacBook Pro 16\" M3 Max (36GB RAM / 1TB SSD) - Space Black",
                "slug": "apple-macbook-pro-16-m3-max-36gb-1tb",
                "description": "Extreme performance workstation laptop with 16-core CPU, 40-core GPU, Liquid Retina XDR display, and up to 22 hours battery life. Factory sealed with Apple warranty.",
                "category_slug": "laptops",
                "brand_name": "Apple",
                "condition": ProductCondition.NEW,
                "base_price": 890000,
                "compare_at_price": 930000,
                "stock": 4,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
                    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80",
                ],
                "specs": {
                    "cpu": "Apple M3 Max (16-core)",
                    "ram_gb": "32",
                    "storage_gb": "1024",
                    "gpu": "40-core GPU",
                    "screen_size_inch": "16.0",
                    "screen_refresh_rate": "120",
                    "weight_kg": 2.1,
                },
            },
            {
                "title": "Dell XPS 16 9640 (Intel Core Ultra 7 155H / RTX 4070 / 32GB)",
                "slug": "dell-xps-16-ultra-7-rtx-4070",
                "description": "Sleek aluminum chassis with seamless glass touchpad, 4K OLED touch display, NVIDIA GeForce RTX 4070 8GB GDDR6, and 1TB PCIe NVMe SSD.",
                "category_slug": "laptops",
                "brand_name": "Dell",
                "condition": ProductCondition.NEW,
                "base_price": 640000,
                "compare_at_price": 680000,
                "stock": 5,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80",
                ],
                "specs": {
                    "cpu": "Intel Core Ultra 7 155H",
                    "ram_gb": "32",
                    "storage_gb": "1024",
                    "gpu": "RTX 4070 8GB",
                    "screen_size_inch": "16.0",
                    "screen_refresh_rate": "120",
                    "weight_kg": 2.2,
                },
            },
            {
                "title": "Lenovo Legion Pro 7i Gen 9 (Intel i9-14900HX / RTX 4080 12GB)",
                "slug": "lenovo-legion-pro-7i-rtx-4080",
                "description": "High-end esports battle station laptop with ColdFront vapor chamber cooling, 240Hz WQXGA 100% DCI-P3 display, and Legion TrueStrike per-key RGB keyboard.",
                "category_slug": "laptops",
                "brand_name": "Lenovo",
                "condition": ProductCondition.NEW,
                "base_price": 725000,
                "compare_at_price": 765000,
                "stock": 3,
                "agent": agent2,
                "images": [
                    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80",
                ],
                "specs": {
                    "cpu": "Intel Core i9-14900HX",
                    "ram_gb": "32",
                    "storage_gb": "1024",
                    "gpu": "RTX 4080 12GB GDDR6",
                    "screen_size_inch": "16.0",
                    "screen_refresh_rate": "240",
                    "weight_kg": 2.6,
                },
            },
            {
                "title": "Asus ROG Zephyrus G16 (Intel Core Ultra 9 / RTX 4070 / OLED 240Hz)",
                "slug": "asus-rog-zephyrus-g16-oled-240hz",
                "description": "Ultra-slim 1.85kg CNC aluminum gaming ultrabook featuring ROG Nebula OLED 2.5K 240Hz 0.2ms panel, slash lighting array, and 90Wh battery.",
                "category_slug": "laptops",
                "brand_name": "Asus",
                "condition": ProductCondition.NEW,
                "base_price": 595000,
                "compare_at_price": 630000,
                "stock": 6,
                "agent": agent2,
                "images": [
                    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80",
                ],
                "specs": {
                    "cpu": "Intel Core Ultra 9 185H",
                    "ram_gb": "16",
                    "storage_gb": "1024",
                    "gpu": "RTX 4070 8GB GDDR6",
                    "screen_size_inch": "16.0",
                    "screen_refresh_rate": "240",
                    "weight_kg": 1.85,
                },
            },
            {
                "title": "Apple MacBook Air 13\" M3 (16GB Unified RAM / 512GB SSD) - Starlight",
                "slug": "apple-macbook-air-13-m3-16gb-512gb",
                "description": "Ultra-portable silent fanless design with 13.6-inch Liquid Retina display, MagSafe charging, 1080p FaceTime HD camera, and dual external monitor support.",
                "category_slug": "laptops",
                "brand_name": "Apple",
                "condition": ProductCondition.NEW,
                "base_price": 385000,
                "compare_at_price": 410000,
                "stock": 11,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80",
                ],
                "specs": {
                    "cpu": "Apple M3 (8-core)",
                    "ram_gb": "16",
                    "storage_gb": "512",
                    "gpu": "10-core Integrated GPU",
                    "screen_size_inch": "13.3",
                    "screen_refresh_rate": "60",
                    "weight_kg": 1.24,
                },
            },

            # Accessories & Audio
            {
                "title": "Sony WH-1000XM5 Wireless Noise Canceling Headphones (Silver)",
                "slug": "sony-wh1000xm5-silver",
                "description": "Industry-leading active noise cancellation with 8 microphones, Auto NC Optimizer, 30-hour battery life, and crystal-clear hands-free calling.",
                "category_slug": "accessories",
                "brand_name": "Sony",
                "condition": ProductCondition.NEW,
                "base_price": 95000,
                "compare_at_price": 105000,
                "stock": 18,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                ],
                "specs": {
                    "accessory_type": "Earbuds / Headphones",
                    "connectivity": "Bluetooth",
                    "battery_life_hours": 30,
                    "warranty_months": "12 Months",
                },
            },
            {
                "title": "Apple AirPods Pro (2nd Generation with MagSafe USB-C)",
                "slug": "apple-airpods-pro-2nd-gen-usbc",
                "description": "H2 chip with up to 2x more Active Noise Cancellation, Adaptive Audio, Transparency mode, and Personalized Spatial Audio with dynamic head tracking.",
                "category_slug": "accessories",
                "brand_name": "Apple",
                "condition": ProductCondition.NEW,
                "base_price": 68000,
                "compare_at_price": 75000,
                "stock": 25,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80",
                ],
                "specs": {
                    "accessory_type": "Earbuds / Headphones",
                    "connectivity": "Bluetooth",
                    "battery_life_hours": 30,
                    "warranty_months": "6 Months",
                },
            },
            {
                "title": "Samsung Galaxy Watch Ultra 47mm (Titanium Silver / LTE)",
                "slug": "samsung-galaxy-watch-ultra-47mm",
                "description": "Rugged cushion titanium case with sapphire crystal, 10ATM / IP68 water resistance, dual-frequency GPS, and up to 100 hours power saving mode.",
                "category_slug": "accessories",
                "brand_name": "Samsung",
                "condition": ProductCondition.NEW,
                "base_price": 145000,
                "compare_at_price": 160000,
                "stock": 7,
                "agent": agent2,
                "images": [
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                ],
                "specs": {
                    "accessory_type": "Smartwatch",
                    "connectivity": "Bluetooth",
                    "battery_life_hours": 100,
                    "warranty_months": "12 Months",
                },
            },
            {
                "title": "Apple Watch Ultra 2 (49mm Titanium Case with Ocean Band)",
                "slug": "apple-watch-ultra-2-49mm",
                "description": "The most rugged Apple Watch for endurance athletes and outdoor adventurers. 3000-nit display, S9 SiP chip, precision dual-frequency GPS, and up to 36 hours normal use.",
                "category_slug": "accessories",
                "brand_name": "Apple",
                "condition": ProductCondition.NEW,
                "base_price": 245000,
                "compare_at_price": 265000,
                "stock": 5,
                "agent": agent2,
                "images": [
                    "https://images.unsplash.com/photo-1510017803434-a899398421b3?w=800&q=80",
                ],
                "specs": {
                    "accessory_type": "Smartwatch",
                    "connectivity": "Bluetooth",
                    "battery_life_hours": 36,
                    "warranty_months": "12 Months",
                },
            },
            {
                "title": "Sony WF-1000XM5 True Wireless Earbuds (Black)",
                "slug": "sony-wf1000xm5-black",
                "description": "Integrated Processor V2 and HD Noise Canceling Processor QN2e. Dynamic Driver X for wide frequency reproduction and rich vocals with LDAC support.",
                "category_slug": "accessories",
                "brand_name": "Sony",
                "condition": ProductCondition.NEW,
                "base_price": 62000,
                "compare_at_price": 68000,
                "stock": 12,
                "agent": agent1,
                "images": [
                    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
                ],
                "specs": {
                    "accessory_type": "Earbuds / Headphones",
                    "connectivity": "Bluetooth",
                    "battery_life_hours": 24,
                    "warranty_months": "6 Months",
                },
            },
        ]

        seeded_count = 0
        for item in product_seeds:
            stmt = select(Product).where(Product.slug == item["slug"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                category = categories_map[item["category_slug"]]
                brand = brands_map[item["brand_name"].lower()]
                agent = item["agent"]

                prod = Product(
                    agent_id=agent.id,
                    category_id=category.id,
                    brand_id=brand.id,
                    brand=brand.name,
                    title=item["title"],
                    slug=item["slug"],
                    description=item["description"],
                    condition=item["condition"],
                    base_price=item["base_price"],
                    compare_at_price=item.get("compare_at_price"),
                    stock=item["stock"],
                    status=ProductStatus.PUBLISHED,
                    specs=item["specs"],
                    images=item["images"],
                    variants=[],
                    rating=5.0,
                    review_count=12,
                )
                session.add(prod)
                agent.product_count += 1
                seeded_count += 1

        await session.commit()
        print(f"\n[OK] Catalog seeding complete! Added {seeded_count} products across categories.")


if __name__ == "__main__":
    asyncio.run(seed_catalog_data())
