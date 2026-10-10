from typing import Any, List, Optional

# Default Flat Shipping in PKR integer
DEFAULT_SHIPPING_FEE_PKR = 500

# Max wallet reward redemption percentage (50% of subtotal)
MAX_WALLET_REDEMPTION_PERCENT = 0.50

# Cashback reward rate on delivered orders (2%)
CASHBACK_RATE = 0.02


def calculate_shipping_fee(items: Optional[List[Any]] = None, city: Optional[str] = None) -> int:
    """
    Centralized calculation of shipping fee in non-fractional PKR integer.
    Architecture allows future extension for city-based, agent-based, or threshold-based free shipping.
    """
    return DEFAULT_SHIPPING_FEE_PKR


def calculate_wallet_discount(subtotal: int, available_wallet: int, requested_wallet: int) -> int:
    """
    Calculates allowable wallet redemption up to 50% of eligible subtotal.
    """
    if requested_wallet <= 0 or available_wallet <= 0 or subtotal <= 0:
        return 0

    max_allowed = int(subtotal * MAX_WALLET_REDEMPTION_PERCENT)
    return min(requested_wallet, available_wallet, max_allowed)


def calculate_cashback_reward(subtotal: int) -> int:
    """
    Calculates 2% cashback reward on eligible delivered subtotal.
    """
    if subtotal <= 0:
        return 0
    return int(subtotal * CASHBACK_RATE)
