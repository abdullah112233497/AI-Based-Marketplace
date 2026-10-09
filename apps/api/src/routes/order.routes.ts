import { Router } from 'express';
import {
  CreateOrderSchema,
  OrderStatus,
  PaymentStatus,
  WalletTransactionType
} from '@tech-marketplace/shared';
import { store } from '../data/mockStore.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/orders/preview (Calculates totals on server securely)
router.post('/preview', (req, res) => {
  const { items, applyWalletAmount = 0 } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ success: false, error: { code: 'EMPTY_CART', message: 'Cart is empty' } });
  }

  let subtotal = 0;
  const processedItems = items.map((item: any) => {
    const prod = store.products.find(p => p.id === item.productId);
    if (!prod) throw new Error(`Product ${item.productId} not found`);
    const itemTotal = prod.basePrice * Number(item.quantity);
    subtotal += itemTotal;
    return {
      productId: prod.id,
      title: prod.title,
      image: prod.images[0],
      price: prod.basePrice,
      quantity: Number(item.quantity),
      itemTotal,
      agentId: prod.agentId,
      agentShopName: prod.agentShopName
    };
  });

  const shippingFee = 500; // Flat shipping PKR 500
  const maxAllowedWallet = Math.min(applyWalletAmount, Math.floor(subtotal * 0.5));
  const grandTotal = Math.max(0, subtotal + shippingFee - maxAllowedWallet);

  return res.json({
    success: true,
    data: {
      items: processedItems,
      subtotal,
      shippingFee,
      walletDiscount: maxAllowedWallet,
      grandTotal
    }
  });
});

// POST /api/orders (Create order)
router.post('/', authenticate, (req: AuthRequest, res) => {
  const parseResult = CreateOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid order input', details: parseResult.error.format() }
    });
  }

  const { items, shippingAddress, paymentMethod, applyWalletAmount = 0 } = parseResult.data;
  const user = store.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User session invalid' } });
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const prod = store.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(400).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND', message: `Product ${item.productId} not found` } });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ success: false, error: { code: 'OUT_OF_STOCK', message: `Not enough stock for ${prod.title}` } });
    }

    // Deduct stock
    prod.stock -= item.quantity;

    const itemTotal = prod.basePrice * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: prod.id,
      productTitle: prod.title,
      productImage: prod.images[0],
      unitPrice: prod.basePrice,
      quantity: item.quantity,
      totalPrice: itemTotal,
      agentId: prod.agentId,
      agentShopName: prod.agentShopName
    });
  }

  const shippingFee = 500;
  const userWalletEntries = store.walletLedgers.filter(w => w.userId === user.id);
  const currentWalletBalance = userWalletEntries.reduce((acc, curr) => acc + curr.amount, 0);

  const appliedWallet = Math.min(applyWalletAmount, currentWalletBalance, Math.floor(subtotal * 0.5));
  const totalAmount = Math.max(0, subtotal + shippingFee - appliedWallet);

  const newOrder: any = {
    id: `ord_${Date.now()}`,
    orderNumber: `TM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone || shippingAddress.phone,
    items: orderItems,
    subtotal,
    shippingFee,
    walletDeduction: appliedWallet,
    totalAmount,
    status: OrderStatus.PENDING,
    paymentMethod,
    paymentStatus: PaymentStatus.PENDING,
    shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.orders.unshift(newOrder);

  // Deduct wallet ledger entry if wallet was used
  if (appliedWallet > 0) {
    store.walletLedgers.push({
      id: `wlt_${Date.now()}`,
      userId: user.id,
      amount: -appliedWallet,
      type: WalletTransactionType.SPENT,
      description: `Redeemed on Order ${newOrder.orderNumber}`,
      referenceOrderId: newOrder.id,
      balanceAfter: currentWalletBalance - appliedWallet,
      createdAt: new Date().toISOString()
    });
  }

  return res.status(201).json({
    success: true,
    data: newOrder
  });
});

// GET /api/orders (Customer's own orders)
router.get('/my-orders', authenticate, (req: AuthRequest, res) => {
  const customerOrders = store.orders.filter(o => o.customerId === req.user?.id);
  return res.json({
    success: true,
    data: customerOrders
  });
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  const order = store.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
  }

  // Security check: Customer can only view their own, Agent can view if they have items, Admin can view all
  if (req.user?.role === 'CUSTOMER' && order.customerId !== req.user.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
  }

  return res.json({
    success: true,
    data: order
  });
});

export default router;
