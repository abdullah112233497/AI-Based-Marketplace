# PHASE 4 — CART, CHECKOUT, ORDERS, INVENTORY, COMMISSION & REWARD FOUNDATION
## Comprehensive Engineering Architecture & Implementation Report

---

## 1. Executive Summary & Architecture Overview

Phase 4 establishes the transactional commerce backbone for the **AI-Powered Multi-Vendor Technology Marketplace**. Built natively upon **FastAPI**, **PostgreSQL (Neon Cloud Serverless)**, **Async SQLAlchemy 2.x**, and **Pydantic v2**, this subsystem transitions the platform from a catalog browsing environment into an authoritative, multi-tenant marketplace transactional engine.

The architecture addresses the core challenges of distributed multi-vendor commerce:
1. **Server-Authoritative Transactions**: Elimination of client-side price or discount trust. All subtotals, shipping charges, wallet deductions, and cashback rewards are recalculated server-side within isolated database transactions.
2. **Strict Concurrency Control**: Elimination of race conditions and inventory overselling under high concurrency via row-level pessimistic locking (`SELECT ... FOR UPDATE`).
3. **Auditability & Snapshot Immutability**: All purchased items freeze their title, unit price, category, specifications snapshot, image, and commission rates at checkout time, insulating historical order records from subsequent vendor price changes or product mutations.
4. **Idempotent Financial Ledgers**: Both platform commission settlement and customer reward cashback operate through append-only ledgers guarded by database flags (`reward_credited`, `stock_restored`, `commission_settled`) and unique reference keys.
5. **Strict Scope Boundaries**: Phase 4 focuses strictly on Cash on Delivery (COD) workflows. No external payment gateways, courier tracking integrations, or AI shopping agents were introduced, adhering directly to scope constraints.

---

## 2. Sole Developer Ownership Declaration

This entire phase was designed, implemented, migrated, integrated, and verified solely by:

**Muhammad Saad Raza**  
*Principal Software Architect & Lead Backend Engineer*

All database models, migrations, domain services, Pydantic schemas, FastAPI routers, frontend integration hooks, and automated integration test suites are the sole work of **Muhammad Saad Raza**.

---

## 3. Non-Fractional PKR Currency Standard & Ledger Design

In alignment with standard Pakistani financial regulations and high-performance accounting best practices, all currency amounts throughout Phase 4 are stored as non-fractional integers representing whole Pakistani Rupees (**PKR**).

```
+-------------------------------------------------------------+
|               Marketplace Integer PKR Policy               |
+-------------------------------------------------------------+
| Product Price      | INTEGER PKR (e.g., 250,000 PKR)        |
| Item Subtotal      | INTEGER PKR                            |
| Shipping Fee       | INTEGER PKR (Fixed 500 PKR flat)       |
| Wallet Discount    | INTEGER PKR (Max 50% eligible subtotal)|
| Total Amount       | INTEGER PKR (Subtotal + Ship - Wallet) |
| Commission Amount  | INTEGER PKR (Math: int(subtotal * rate)|
| Customer Reward    | INTEGER PKR (Math: int(subtotal * 0.02)|
| Wallet Balance     | INTEGER PKR (Non-negative running sum) |
+-------------------------------------------------------------+
```

Float arithmetic is strictly avoided for money storage to prevent IEEE 754 precision drift. Rates and percentages are stored as numeric floats (e.g., `0.045` for 4.5%), while basis amounts and final currency results are rounded to integer PKR at the service layer boundary.

---

## 4. Persistent Database Shopping Cart (`Cart` & `CartItem` Models)

To support seamless cross-device shopping experiences and persistent cart recovery across sessions, the shopping cart is modeled directly in PostgreSQL:

- **`Cart` (`carts` table)**:
  - `id`: UUID (Primary Key)
  - `user_id`: UUID (Foreign Key to `users.id`, Unique Constraint: 1-to-1 per customer)
  - `created_at`, `updated_at`: UTC timestamps
  - Relationship: `items` (one-to-many cascade delete to `CartItem`)
- **`CartItem` (`cart_items` table)**:
  - `id`: UUID (Primary Key)
  - `cart_id`: UUID (Foreign Key to `carts.id`, indexed)
  - `product_id`: UUID (Foreign Key to `products.id`, indexed)
  - `variant_id`: String (Optional variant SKU or ID)
  - `quantity`: Integer (Constrained `quantity > 0`)
  - Unique Constraint: `uq_cart_product_variant (cart_id, product_id, variant_id)`

---

## 5. Shopping Cart API Specification

The Cart subsystem is exposed under `/api/v1/cart` and requires an active customer session:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Retrieves the authenticated customer's cart with live stock, merchant details, and subtotal. | Customer / Any |
| `POST` | `/api/v1/cart/items` | Adds product unit(s) to cart after verifying publisher status and available inventory. | Customer / Any |
| `PATCH` | `/api/v1/cart/items/{id}` | Updates item quantity; validates stock and rejects increments exceeding available stock (`INSUFFICIENT_STOCK`). | Customer / Any |
| `DELETE` | `/api/v1/cart/items/{id}` | Removes a specific line item from the shopping cart. | Customer / Any |
| `DELETE` | `/api/v1/cart` | Clears all line items from the shopping cart. | Customer / Any |

---

## 6. Frontend Shopping Cart Synchronization & Multi-Device Persistence

The web frontend (`apps/web/src/lib/cart-context.tsx`) was upgraded from browser-only `localStorage` to a resilient **hybrid synchronization model**:
1. **Unauthenticated Guests**: Cart items are stored temporarily in client `localStorage`.
2. **Authenticated Users**: On login or page initialization, the client syncs with `GET /api/v1/cart` on FastAPI port `8000`. Add, update, and remove mutations immediately call the backend API, ensuring that a user switching from desktop to mobile retains their active cart.
3. **Optimistic Updates & Error Rollback**: Network requests update UI state optimistically, reverting and displaying toast alerts if backend stock constraints are violated.

---

## 7. Authoritative Server-Side Checkout Calculation Engine

Clients are never trusted with financial calculations. Client requests transmit only product identifiers, desired quantities, and discount intentions. The calculation engine (`apps/backend/app/services/pricing_service.py`):
1. Loads active product rows from PostgreSQL using authoritative database prices.
2. Filters out inactive or archived products.
3. Computes exact line totals: `unit_price * quantity`.
4. Derives the order subtotal: `sum(item_totals)`.
5. Computes non-waivable flat shipping fee: `PKR 500`.
6. Enforces customer wallet redemption rules.

---

## 8. Pricing, Flat Shipping (PKR 500), and Wallet Discount Calculation

### Shipping Policy
A nationwide flat delivery fee of **PKR 500** is applied to every order containing at least one physical item.

### Wallet Redemption Policy
- Customers can redeem earned rewards toward purchases.
- **Safety Cap**: Wallet discount cannot exceed **50% of the order subtotal**, ensuring that all orders maintain a positive net cash flow and prevent negative invoice scenarios.
- Formula:
  $$\text{allowable\_wallet\_discount} = \min(\text{requested\_wallet}, \text{user\_balance}, \lfloor 0.50 \times \text{subtotal} \rfloor)$$
- Grand Total:
  $$\text{grand\_total} = \text{subtotal} + \text{shipping\_fee} - \text{allowable\_wallet\_discount}$$

---

## 9. Checkout Preview API (`POST /orders/preview`)

The `/api/v1/orders/preview` endpoint allows clients to render a live, verified summary before placing an order:
- **Input**: List of `{ productId, quantity, variantId }` and `applyWalletAmount` or `useWallet`.
- **Validation**: Verifies stock availability and merchant status for all items.
- **Output**:
  - `items`: Item list with titles, thumbnail images, verified unit prices, and merchant shop names.
  - `subtotal`: Integer PKR subtotal.
  - `shippingFee`: Flat 500 PKR.
  - `walletDiscount`: Allowable wallet redemption in PKR.
  - `grandTotal` / `totalAmount`: Exact final amount payable.
  - `estimatedReward`: 2% eligible cashback reward (e.g., `int(subtotal * 0.02)`).

---

## 10. Database Concurrency Control & Pessimistic Row Locking (`SELECT ... FOR UPDATE`)

To prevent the classic e-commerce overselling defect—where multiple users buy the last remaining stock unit simultaneously—the inventory engine (`apps/backend/app/services/inventory_service.py`) employs PostgreSQL pessimistic locking:

```python
stmt = (
    select(Product)
    .where(Product.id.in_(product_ids))
    .with_for_update()
)
result = await db.execute(stmt)
locked_products = result.scalars().all()
```

### Guarantees
1. Any concurrent transaction attempting to lock or mutate the same product row is blocked until the active transaction commits or rolls back.
2. Stock is verified against requested quantities on the locked row. If `product.stock < requested_quantity`, an `INSUFFICIENT_STOCK` exception is raised and the transaction is cleanly aborted.
3. Deductions occur atomically within the same database transaction boundary.

---

## 11. Atomic Order Creation Transaction Pipeline

The checkout endpoint (`POST /api/v1/orders`) executes the following operations atomically inside a single ACID database transaction:

```
+-------------------------------------------------------------------------+
|                  Order Creation Atomic Transaction                      |
+-------------------------------------------------------------------------+
|  1. Resolve items (from request body or fallback to customer Cart)      |
|  2. SELECT Product ... FOR UPDATE (Row-level pessimistic lock)         |
|  3. Validate availability & stock (reject if stock < qty)               |
|  4. Recalculate subtotal, shipping (500 PKR), and allowable wallet disc |
|  5. Decrement inventory on locked Product rows                          |
|  6. Insert Order record (PENDING status, COD method)                    |
|  7. Insert OrderItem snapshot records (frozen title, price, specs, etc) |
|  8. Generate CommissionRecord entries (PENDING audit records)           |
|  9. If wallet used: record SPENT entry in WalletLedger                  |
| 10. Delete purchased items from customer's persistent Cart              |
| 11. Commit Transaction & Release Locks                                  |
+-------------------------------------------------------------------------+
```

---

## 12. Historical Snapshotting of Order Items (Frozen Attributes)

`OrderItem` rows store immutable snapshots rather than depending on live product tables:
- `product_title`: Title at purchase time.
- `product_slug`: Slug at purchase time.
- `product_image`: Primary thumbnail URL at purchase time.
- `unit_price`: Authoritative unit price at purchase time.
- `quantity`: Quantity purchased.
- `total_price`: Line total.
- `commission_rate`: Applicable commission percentage snapshot.
- `commission_amount`: Calculated marketplace commission.
- `specs_snapshot`: Complete dynamic specifications dictionary at purchase time.

If a vendor renames a product, increases its price, or alters its specifications next week, existing customer invoices and agent fulfillment records remain perfectly intact.

---

## 13. Human-Readable Order Identifiers & Anti-Collision Formatting

Orders are assigned a distinct, human-friendly order identifier:
- Format: `TM-YYYY-NNNNNN` (e.g., `TM-2026-632375`)
- Stored in `orders.order_number` with a unique index.
- Lookup queries in `GET /api/v1/orders/{id_or_number}` accept either the UUID Primary Key or the human-readable order number.

---

## 14. Cash on Delivery (COD) Payment Flow & State Transitions

Phase 4 standardizes on **Cash on Delivery (COD)**:
- At order creation:
  - `status`: `OrderStatus.PENDING`
  - `payment_method`: `PaymentMethod.COD`
  - `payment_status`: `PaymentStatus.PENDING`
- Upon delivery fulfillment:
  - When the agent transitions the order to `DELIVERED`, `payment_status` is automatically updated to `PaymentStatus.PAID`.

---

## 15. Multi-Tenant Agent Order Fulfillment Portal

Agents have access to a dedicated fulfillment management suite:
- Multi-tenant isolation guarantees that an agent can only view and manage orders that contain items produced by their own shop (`OrderItem.agent_id == agent.id`).
- Orders containing items from multiple vendors display only the relevant line items to the respective vendor or are scoped appropriately.

---

## 16. Agent Order Listing & Scoped Isolation (`GET /agent/orders`)

- **Endpoint**: `GET /api/v1/agent/orders`
- **Security**: Requires `require_approved_agent` dependency.
- **Query Filter**: `WHERE order_items.agent_id == current_user.agent.id`
- **Output**: Chronologically sorted list of orders with customer contact details, shipping address, and shop-specific item totals.

---

## 17. Validated Order Lifecycle State Machine

Order state transitions follow an explicit finite state machine:

```
               [PENDING]
              /         \
   (Confirm) /           \ (Cancel)
            v             v
      [CONFIRMED]    [CANCELLED] (Terminal)
       /        \
(Ship)/          \(Cancel)
     v            v
  [SHIPPED]   [CANCELLED]
     |
(Deliver)
     v
[DELIVERED] (Terminal)
```

### Transition Enforcement Rules
- `PENDING` $\rightarrow$ `CONFIRMED`, `CANCELLED`
- `CONFIRMED` $\rightarrow$ `SHIPPED`, `CANCELLED`
- `SHIPPED` $\rightarrow$ `DELIVERED` (Once shipped, orders cannot be cancelled directly in the standard flow)
- `DELIVERED` $\rightarrow$ Terminal (No backward transitions allowed)
- `CANCELLED` $\rightarrow$ Terminal (No backward transitions allowed)
- **Idempotency**: Submitting a transition request for the current status (e.g., calling `DELIVERED` when already `DELIVERED`) is treated as an idempotent success without side effects.

---

## 18. Order Status Update API (`PATCH /agent/orders/{id}/status`)

- **Endpoint**: `PATCH /api/v1/agent/orders/{id}/status`
- **Payload**:
  - `status`: Target `OrderStatus`
  - `trackingNumber`: Optional courier tracking number (valid during `SHIPPED`)
  - `courierName`: Optional carrier name (e.g., TCS, Leopard, M&P)
  - `cancellationReason`: Required/optional explanation if cancelling
- **Authorization**:
  - Rejects foreign agents with `403 Forbidden`.
  - Rejects illegal state progressions with `400 INVALID_STATUS_TRANSITION`.

---

## 19. Terminal State Delivery & Automated Commission Settlement

When an order transitions to `DELIVERED`:
1. The domain service `settle_order_commissions(db, order)` is triggered.
2. All `CommissionRecord` rows associated with the order transition from `PENDING` to `EARNED`.
3. `order.commission_settled` is set to `True`.
4. The operation is idempotent: if `order.commission_settled` is already `True`, settlement is skipped to prevent duplicate records.

---

## 20. Terminal State Delivery & 2% Eligible Subtotal Cashback Credit

Upon verified delivery:
1. The reward engine computes 2% cashback based on the order's subtotal:
   $$\text{cashback} = \lfloor \text{order.subtotal} \times 0.02 \rfloor$$
2. An append-only ledger transaction is inserted into `wallet_ledgers`:
   - `type`: `WalletTransactionType.EARNED`
   - `amount`: `+cashback`
   - `reference_order_id`: Order Number
   - `balance_after`: Previous Balance + `cashback`
3. `order.reward_credited` is set to `True`.
4. Idempotency guarantees prevent duplicate reward distribution if status updates are retransmitted.

---

## 21. Immutable Customer Rewards Wallet & Append-Only Ledger (`WalletLedger`)

Customer reward balances are never stored as a mutable integer column that can drift. Balance is derived and audited through the `wallet_ledgers` table:

```
+------------------------------------------------------------------------------------+
|                               wallet_ledgers Table                                 |
+------------------------------------------------------------------------------------+
| id                 | UUID (Primary Key)                                            |
| user_id            | UUID (Foreign Key to users.id)                                |
| order_id           | UUID (Foreign Key to orders.id, nullable)                     |
| type               | Enum ('EARNED', 'SPENT', 'REFUND', 'ADMIN_ADJUSTMENT')         |
| amount             | Integer (+credits, -debits)                                   |
| balance_after      | Integer running balance snapshot                              |
| description        | Human-readable narrative                                      |
| reference_order_id | Order number tracking code                                    |
| created_at         | UTC timestamp                                                 |
+------------------------------------------------------------------------------------+
```

---

## 22. Customer Wallet Balance & History API (`GET /customer/wallet`)

- **Endpoint**: `GET /api/v1/customer/wallet`
- **Output**:
  - `balance`: Current total available reward points (PKR).
  - `ledgers` / `ledger`: Chronological transaction history with dates, amounts, transaction types, and descriptions.

---

## 23. Order Cancellation & Idempotent Inventory Restoration (`stock_restored` Guard)

When an order is cancelled:
1. `restore_order_inventory(db, order)` locks the affected product rows.
2. Quantities purchased are restored to `product.stock`.
3. **Idempotency Guard**: `order.stock_restored` is set to `True`. Subsequent cancellation calls check `if order.stock_restored: return`, guaranteeing that stock is never restored twice.

---

## 24. Order Cancellation Commission Invalidation & Wallet Refund Logic

Upon cancellation:
1. Commission records are marked `CANCELLED`.
2. If the customer redeemed wallet rewards during checkout (`order.wallet_discount > 0`):
   - A `REFUND` ledger transaction is appended to `wallet_ledgers`.
   - The redeemed points are immediately restored to the customer's balance.

---

## 25. Configurable Marketplace Commission Engine (`CommissionRule` & Fallbacks)

Commission rates are category-configurable and managed via the `commission_rules` table:

| Category Slug | Default Rate | Rule Type | Description |
|---|---|---|---|
| `mobiles` | 4.5% (`0.045`) | Percentage | Mobile devices and smartphones |
| `laptops` | 4.0% (`0.040`) | Percentage | High-value laptops and workstations |
| `accessories` | 8.0% (`0.080`) | Percentage | Tech accessories and peripherals |
| *Platform Fallback* | 5.0% (`0.050`) | Percentage | Default platform fee for other goods |

---

## 26. Auditable Commission Records Ledger (`CommissionRecord`)

Every item purchased creates a dedicated `CommissionRecord` row:
- `order_id`: UUID
- `order_item_id`: UUID
- `agent_id`: UUID
- `basis_amount`: Item Total PKR
- `rate`: Decimal rate applied (e.g., 0.045)
- `commission_amount`: Integer PKR
- `status`: `PENDING` $\rightarrow$ `EARNED` or `CANCELLED`

---

## 27. Admin Commission Management APIs

Platform administrators manage and audit commissions under `/api/v1/admin/commission`:
- `GET /api/v1/admin/commission`: Lists all category rules (auto-seeds defaults if empty).
- `PUT /api/v1/admin/commission`: Updates category commission rate (supports both `0.06` rate and `6.0%` percentage inputs).
- `GET /api/v1/admin/commission/records`: Returns paginated platform-wide commission ledger with settlement timestamps.

---

## 28. Role-Based Access Control (RBAC) & Boundary Isolation

Strict RBAC dependencies safeguard commerce endpoints:
- **Customers**: Can manage only their own cart (`/cart`) and orders (`/orders/me`). Forbidden from agent portals and admin configuration.
- **Agents**: Can view and manage only orders containing their shop's inventory (`/agent/orders`). Forbidden from modifying other agents' orders (`403 Forbidden`).
- **Admins**: Superuser authority over commission rules, dispute resolution, and platform-wide records.

---

## 29. Automated Integration Testing Strategy & Complete Pytest Suite Execution

A comprehensive, production-grade integration test suite was created in `apps/backend/tests/test_commerce.py` and executed against the live PostgreSQL database.

### Test Coverage Breakdown

```
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-9.1.1
rootdir: D:\Programming\Projects\AI-Based Marketplace\apps\backend
configfile: pyproject.toml

tests/test_auth.py .................................................. [PASSED] (10 tests)
tests/test_catalog.py ............................................... [PASSED] ( 7 tests)
tests/test_commerce.py .............................................. [PASSED] ( 6 tests)
tests/test_health.py ................................................ [PASSED] ( 5 tests)
tests/test_rbac.py .................................................. [PASSED] ( 6 tests)

============================= 34 passed in 373.05s =============================
```

### Commerce Test Scenarios Verified
1. **`test_cart_crud_lifecycle`**: Add item, fetch cart, update quantity, reject stock excess (`INSUFFICIENT_STOCK`), delete item, clear cart.
2. **`test_order_preview_calculation`**: Subtotal calculation, 500 PKR shipping, wallet discount cap, 2% cashback estimate.
3. **`test_checkout_atomic_order_creation_and_inventory`**: Atomic transaction, row locking, stock decrement from 5 to 3, cart cleanup, order snapshot creation.
4. **`test_agent_order_fulfillment_lifecycle`**: Agent order isolation, Agent B modification rejection (`403`), state progression (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`), terminal state reward crediting (800 PKR), and idempotency.
5. **`test_order_cancellation_and_inventory_restoration`**: Inventory decrement on order, restoration on cancel, idempotent guard against duplicate restoration.
6. **`test_admin_commission_rules_and_records`**: Rule listing, category rate update (mobiles to 6%), customer RBAC rejection (`403`).

---

## 30. Production Readiness, Migration Summary, and Next Phase Roadmap

### Database Migration
- Alembic Revision: `2f7c4ebf9709_create_phase4_commerce_cart_orders_.py`
- Tables Created: `carts`, `cart_items`, `orders`, `order_items`, `commission_rules`, `commission_records`, `wallet_ledgers`.
- Status: Fully applied and verified on live Neon Serverless DB (`alembic upgrade head`).

### System Verification
- FastAPI Server: Daemon active and listening on `http://127.0.0.1:8000`.
- API Health Status: Operational (`HTTP 200`).
- Docs: Available at `http://127.0.0.1:8000/docs`.

### Next Phase Preparation (Phase 5)
Phase 4 provides the rock-solid transactional foundation required for subsequent platform phases:
- Real-time courier webhooks and automated tracking status updates.
- External payment gateway integrations (JazzCash, EasyPaisa, Stripe).
- AI Shopping Assistant / Conversational Copilot order integration.
- n8n automated email and SMS customer notifications.
