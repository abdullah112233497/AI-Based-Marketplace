import { Router } from 'express';
import {
  ProductCreateUpdateSchema,
  UpdateAgentProfileSchema,
  UpdateOrderStatusSchema,
  UserRole,
  AgentStatus,
  ProductStatus,
  OrderStatus
} from '@tech-marketplace/shared';
import { store } from '../data/mockStore.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Public agent profile view
router.get('/public/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const agent = store.agents.find(a => a.shopSlug === slugOrId || a.id === slugOrId);

  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent shop not found' } });
  }

  const products = store.products.filter(p => p.agentId === agent.id && p.status === ProductStatus.PUBLISHED);

  return res.json({
    success: true,
    data: {
      ...agent,
      products
    }
  });
});

// GET /api/agent/directory (Public list of verified agents)
router.get('/directory', (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  const city = String(req.query.city || '').toLowerCase();

  let list = store.agents.filter(a => a.status === AgentStatus.APPROVED);

  if (search) {
    list = list.filter(a => a.shopName.toLowerCase().includes(search) || a.city.toLowerCase().includes(search));
  }
  if (city) {
    list = list.filter(a => a.city.toLowerCase() === city);
  }

  return res.json({
    success: true,
    data: list
  });
});

// Protect all following routes with Agent role
router.use(authenticate, requireRole(UserRole.AGENT, UserRole.ADMIN));

// GET /api/agent/overview (Agent dashboard stats)
router.get('/overview', (req: AuthRequest, res) => {
  const agentId = req.user?.agentId || 'agent_lahore';
  const agent = store.agents.find(a => a.id === agentId);
  const myProducts = store.products.filter(p => p.agentId === agentId);
  const myOrders = store.orders.filter(o => o.items.some(i => i.agentId === agentId));

  const totalSales = myOrders
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((acc, o) => {
      const agentItems = o.items.filter(i => i.agentId === agentId);
      return acc + agentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }, 0);

  const pendingOrders = myOrders.filter(o => o.status === OrderStatus.PENDING).length;
  const lowStockProducts = myProducts.filter(p => p.stock < 5);

  return res.json({
    success: true,
    data: {
      agent,
      stats: {
        totalProducts: myProducts.length,
        totalOrders: myOrders.length,
        pendingOrders,
        totalSales,
        rating: agent?.rating || 5.0
      },
      lowStockProducts,
      recentOrders: myOrders.slice(0, 5)
    }
  });
});

// GET /api/agent/products (List products owned by this agent)
router.get('/products', (req: AuthRequest, res) => {
  const agentId = req.user?.agentId || 'agent_lahore';
  const products = store.products.filter(p => p.agentId === agentId);
  return res.json({ success: true, data: products });
});

// POST /api/agent/products (Create product)
router.post('/products', (req: AuthRequest, res) => {
  const agentId = req.user?.agentId || 'agent_lahore';
  const agent = store.agents.find(a => a.id === agentId);

  if (!agent) {
    return res.status(403).json({ success: false, error: { code: 'NO_AGENT_PROFILE', message: 'No registered agent profile' } });
  }

  if (agent.status !== AgentStatus.APPROVED) {
    return res.status(403).json({ success: false, error: { code: 'PENDING_APPROVAL', message: 'Agent account is under review' } });
  }

  const parseResult = ProductCreateUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid product data', details: parseResult.error.format() }
    });
  }

  const cat = store.categories.find(c => c.id === parseResult.data.categoryId);

  const newProduct: any = {
    id: `prod_${Date.now()}`,
    slug: parseResult.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    ...parseResult.data,
    categoryName: cat?.name || 'Electronics',
    agentId: agent.id,
    agentShopName: agent.shopName,
    agentCity: agent.city,
    agentIsVerified: agent.isVerified,
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString()
  };

  store.products.unshift(newProduct);
  agent.productCount += 1;

  return res.status(201).json({ success: true, data: newProduct });
});

// PUT /api/agent/products/:id (Edit product)
router.put('/products/:id', (req: AuthRequest, res) => {
  const agentId = req.user?.agentId || 'agent_lahore';
  const index = store.products.findIndex(p => p.id === req.params.id && p.agentId === agentId);

  if (index === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found or not owned by you' } });
  }

  const parseResult = ProductCreateUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid product data', details: parseResult.error.format() }
    });
  }

  const existing = store.products[index];
  const updated = {
    ...existing,
    ...parseResult.data
  };

  store.products[index] = updated;
  return res.json({ success: true, data: updated });
});

// GET /api/agent/orders (Orders for agent's products)
router.get('/orders', (req: AuthRequest, res) => {
  const agentId = req.user?.agentId || 'agent_lahore';
  const orders = store.orders.filter(o => o.items.some(i => i.agentId === agentId));
  return res.json({ success: true, data: orders });
});

// PATCH /api/agent/orders/:id/status (Order status transition)
router.patch('/orders/:id/status', (req: AuthRequest, res) => {
  const agentId = req.user?.agentId || 'agent_lahore';
  const order = store.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
  }

  const parseResult = UpdateOrderStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid status update', details: parseResult.error.format() }
    });
  }

  const { status, trackingNumber, courierName } = parseResult.data;
  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courierName) order.courierName = courierName;
  order.updatedAt = new Date().toISOString();

  // If delivered, credit cashback reward into customer wallet
  if (status === OrderStatus.DELIVERED) {
    const cashback = Math.floor(order.subtotal * 0.02);
    if (cashback > 0) {
      const userEntries = store.walletLedgers.filter(w => w.userId === order.customerId);
      const currentBal = userEntries.reduce((acc, curr) => acc + curr.amount, 0);
      store.walletLedgers.push({
        id: `wlt_${Date.now()}`,
        userId: order.customerId,
        amount: cashback,
        type: 'EARNED' as any,
        description: `2% Cashback on delivered order ${order.orderNumber}`,
        referenceOrderId: order.id,
        balanceAfter: currentBal + cashback,
        createdAt: new Date().toISOString()
      });
    }
  }

  return res.json({ success: true, data: order });
});

export default router;
