import { Router } from 'express';
import {
  UserRole,
  AgentStatus,
  CategorySpecSchemaSchema,
  CommissionRuleType
} from '@tech-marketplace/shared';
import { store } from '../data/mockStore.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireRole(UserRole.ADMIN));

// GET /api/admin/overview
router.get('/overview', (req, res) => {
  const totalUsers = store.users.length;
  const totalAgents = store.agents.length;
  const pendingAgents = store.agents.filter(a => a.status === AgentStatus.PENDING).length;
  const totalProducts = store.products.length;
  const totalOrders = store.orders.length;
  const totalGMV = store.orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommissions = Math.floor(totalGMV * 0.05);

  return res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalAgents,
        pendingAgents,
        totalProducts,
        totalOrders,
        totalGMV,
        totalCommissions
      },
      recentOrders: store.orders.slice(0, 8),
      recentAgents: store.agents.slice(0, 6)
    }
  });
});

// GET /api/admin/agents
router.get('/agents', (req, res) => {
  return res.json({
    success: true,
    data: store.agents
  });
});

// PATCH /api/admin/agents/:id/status
router.patch('/agents/:id/status', (req, res) => {
  const { status, isVerified } = req.body;
  const agent = store.agents.find(a => a.id === req.params.id);

  if (!agent) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
  }

  if (status) agent.status = status;
  if (typeof isVerified === 'boolean') agent.isVerified = isVerified;

  return res.json({
    success: true,
    data: agent
  });
});

// GET /api/admin/catalog/categories
router.get('/catalog/categories', (req, res) => {
  return res.json({
    success: true,
    data: store.categories
  });
});

// PUT /api/admin/catalog/specs/:categoryId (Edit spec schema)
router.put('/catalog/specs/:categoryId', (req, res) => {
  const category = store.categories.find(c => c.id === req.params.categoryId || c.slug === req.params.categoryId);
  if (!category) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
  }

  const parseResult = CategorySpecSchemaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid spec schema format', details: parseResult.error.format() }
    });
  }

  category.specSchema = parseResult.data;
  return res.json({
    success: true,
    data: category.specSchema
  });
});

// GET /api/admin/commission
router.get('/commission', (req, res) => {
  return res.json({
    success: true,
    data: store.commissionSettings
  });
});

// PUT /api/admin/commission
router.put('/commission', (req, res) => {
  store.commissionSettings = {
    ...store.commissionSettings,
    ...req.body
  };
  return res.json({
    success: true,
    data: store.commissionSettings
  });
});

// GET /api/admin/rewards
router.get('/rewards', (req, res) => {
  return res.json({
    success: true,
    data: store.rewardSettings
  });
});

export default router;
