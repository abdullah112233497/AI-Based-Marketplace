import argparse
import asyncio
import os
import sys
from getpass import getpass
from sqlalchemy import select

from app.core.security import hash_password
from app.db.models.user import User, UserRole
from app.db.session import async_session_factory


async def create_admin(email: str, name: str, password: str) -> None:
    session_factory = async_session_factory()
    async with session_factory() as session:
        # Check if email exists
        stmt = select(User).where(User.email == email.lower().strip())
        result = await session.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            if existing_user.role == UserRole.ADMIN:
                print(f"[!] User with email '{email}' is already an ADMIN (ID: {existing_user.id}). Updating password...")
                existing_user.password_hash = hash_password(password)
                existing_user.is_active = True
                existing_user.is_verified = True
                await session.commit()
                print(f"[+] Successfully updated password for Admin: {email}")
                return
            else:
                print(f"[*] Elevating existing user '{email}' to ADMIN role...")
                existing_user.role = UserRole.ADMIN
                existing_user.password_hash = hash_password(password)
                existing_user.is_active = True
                existing_user.is_verified = True
                await session.commit()
                print(f"[+] Successfully elevated user '{email}' to ADMIN.")
                return

        hashed = hash_password(password)
        new_admin = User(
            name=name.strip(),
            email=email.lower().strip(),
            phone=None,
            password_hash=hashed,
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        session.add(new_admin)
        await session.commit()
        await session.refresh(new_admin)
        print(f"[+] Successfully created Super Admin account: {email} (ID: {new_admin.id})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or elevate a Super Admin user account.")
    parser.add_argument("--email", help="Admin email address", default=os.getenv("ADMIN_EMAIL"))
    parser.add_argument("--name", help="Admin display name", default=os.getenv("ADMIN_NAME", "Super Administrator"))
    parser.add_argument("--password", help="Admin password (if omitted, will be prompted)", default=os.getenv("ADMIN_PASSWORD"))

    args = parser.parse_args()

    email = args.email
    if not email:
        email = input("Enter Admin Email: ").strip()

    name = args.name
    if not name:
        name = input("Enter Admin Name [Super Administrator]: ").strip() or "Super Administrator"

    password = args.password
    if not password:
        password = getpass("Enter Admin Password: ").strip()
        confirm = getpass("Confirm Admin Password: ").strip()
        if password != confirm:
            print("[-] Error: Passwords do not match.")
            sys.exit(1)

    if len(password) < 8:
        print("[-] Error: Password must be at least 8 characters.")
        sys.exit(1)

    asyncio.run(create_admin(email=email, name=name, password=password))


if __name__ == "__main__":
    main()
