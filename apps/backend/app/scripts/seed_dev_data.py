import asyncio
import os
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.db.models.agent import Agent, AgentStatus
from app.db.models.user import User, UserRole
from app.db.session import async_session_factory
from app.utils.slug import generate_unique_shop_slug


async def seed_demo_accounts() -> None:
    """
    Seeds local development demo accounts matching the frontend demo accounts:
    1. Admin: admin@techmarketplace.pk
    2. Approved Agent: lahore@techzone.pk (TechZone Lahore)
    3. Pending Agent: pending@karachitech.pk (Karachi Tech Hub)
    4. Customer: customer@gmail.com
    Standard dev password: Admin123!
    """
    default_password = os.getenv("DEMO_PASSWORD", "Admin123!")
    hashed_pwd = hash_password(default_password)

    session_factory = async_session_factory()
    async with session_factory() as session:
        # 1. Admin Account
        admin_email = "admin@techmarketplace.pk"
        stmt_admin = select(User).where(User.email == admin_email)
        admin_user = (await session.execute(stmt_admin)).scalar_one_or_none()
        if not admin_user:
            admin_user = User(
                name="Platform Administrator",
                email=admin_email,
                phone="03001112233",
                password_hash=hashed_pwd,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            session.add(admin_user)
            print(f"[+] Seeded Super Admin: {admin_email}")
        else:
            admin_user.password_hash = hashed_pwd
            print(f"[*] Super Admin already exists: {admin_email}")

        # 2. Approved Agent Account
        agent_email = "lahore@techzone.pk"
        stmt_agent = select(User).options(selectinload(User.agent)).where(User.email == agent_email)
        agent_user = (await session.execute(stmt_agent)).scalar_one_or_none()
        if not agent_user:
            agent_user = User(
                name="Bilal Farooq",
                email=agent_email,
                phone="03009876543",
                password_hash=hashed_pwd,
                role=UserRole.AGENT,
                is_active=True,
                is_verified=True,
            )
            session.add(agent_user)
            await session.flush()

            slug = await generate_unique_shop_slug(session, "TechZone Lahore")
            agent_profile = Agent(
                user_id=agent_user.id,
                shop_name="TechZone Lahore",
                shop_slug=slug,
                shop_description="Premier flagship smartphones, gaming laptops, and certified electronics.",
                city="Lahore",
                address="Shop 42, 2nd Floor, Hafeez Centre, Main Boulevard, Gulberg III, Lahore",
                contact_phone="03009876543",
                cnic_or_tax_id="35201-1234567-1",
                status=AgentStatus.APPROVED,
                is_verified=True,
                rating=4.9,
                rating_count=38,
                product_count=12,
            )
            session.add(agent_profile)
            print(f"[+] Seeded Approved Agent: {agent_email} (Shop: TechZone Lahore)")
        else:
            agent_user.password_hash = hashed_pwd
            print(f"[*] Approved Agent already exists: {agent_email}")

        # 3. Pending Agent Account
        pending_email = "pending@karachitech.pk"
        stmt_pending = select(User).options(selectinload(User.agent)).where(User.email == pending_email)
        pending_user = (await session.execute(stmt_pending)).scalar_one_or_none()
        if not pending_user:
            pending_user = User(
                name="Tariq Mansoor",
                email=pending_email,
                phone="03211234567",
                password_hash=hashed_pwd,
                role=UserRole.AGENT,
                is_active=True,
                is_verified=False,
            )
            session.add(pending_user)
            await session.flush()

            slug = await generate_unique_shop_slug(session, "Karachi Mobile Hub")
            pending_profile = Agent(
                user_id=pending_user.id,
                shop_name="Karachi Mobile Hub",
                shop_slug=slug,
                shop_description="Wholesale and retail mobile communications and hardware shop.",
                city="Karachi",
                address="Shop 15, Saddar Star City Mall, Karachi",
                contact_phone="03211234567",
                cnic_or_tax_id="42101-7654321-3",
                status=AgentStatus.PENDING,
                is_verified=False,
                rating=5.0,
                rating_count=0,
                product_count=0,
            )
            session.add(pending_profile)
            print(f"[+] Seeded Pending Agent: {pending_email} (Shop: Karachi Mobile Hub)")
        else:
            pending_user.password_hash = hashed_pwd
            print(f"[*] Pending Agent already exists: {pending_email}")

        # 4. Customer Account
        customer_email = "customer@gmail.com"
        stmt_cust = select(User).where(User.email == customer_email)
        cust_user = (await session.execute(stmt_cust)).scalar_one_or_none()
        if not cust_user:
            cust_user = User(
                name="Usman Ali",
                email=customer_email,
                phone="03001234567",
                password_hash=hashed_pwd,
                role=UserRole.CUSTOMER,
                is_active=True,
                is_verified=True,
            )
            session.add(cust_user)
            print(f"[+] Seeded Customer: {customer_email}")
        else:
            cust_user.password_hash = hashed_pwd
            print(f"[*] Customer already exists: {customer_email}")

        await session.commit()
        print("\n[OK] Development database seeding finished successfully.")


if __name__ == "__main__":
    asyncio.run(seed_demo_accounts())
