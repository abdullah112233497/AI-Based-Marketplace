import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  LoginSchema,
  RegisterCustomerSchema,
  RegisterAgentSchema,
  UserRole,
  AgentStatus
} from '@tech-marketplace/shared';
import { store } from '../data/mockStore.js';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid credentials format', details: parseResult.error.format() }
    });
  }

  const { email, password } = parseResult.data;
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // In mock environment: if password is 'password123' or 'Admin123!' or matches hash
  const isValid = user && (password === 'password123' || password === 'Admin123!' || bcrypt.compareSync(password, user.passwordHash));

  if (!user || !isValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' }
    });
  }

  const agent = store.agents.find(a => a.userId === user.id);
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        agentProfile: agent,
        createdAt: user.createdAt
      }
    }
  });
});

// POST /api/auth/register (Customer)
router.post('/register', async (req, res) => {
  const parseResult = RegisterCustomerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid registration input', details: parseResult.error.format() }
    });
  }

  const { name, email, phone, password } = parseResult.data;
  if (store.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' }
    });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: UserRole.CUSTOMER,
    createdAt: new Date().toISOString()
  };

  store.users.push(newUser);

  // Initial welcome wallet bonus 500 PKR
  store.walletLedgers.push({
    id: `wlt_${Date.now()}`,
    userId: newUser.id,
    amount: 500,
    type: 'EARNED' as any,
    description: 'Welcome reward bonus for signing up',
    balanceAfter: 500,
    createdAt: new Date().toISOString()
  });

  const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    }
  });
});

// POST /api/auth/register-agent
router.post('/register-agent', async (req, res) => {
  const parseResult = RegisterAgentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid agent application data', details: parseResult.error.format() }
    });
  }

  const { name, email, phone, password, shopName, city, address, shopDescription } = parseResult.data;
  if (store.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' }
    });
  }

  const userId = `usr_${Date.now()}`;
  const agentId = `agent_${Date.now()}`;

  const newUser = {
    id: userId,
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: UserRole.AGENT,
    createdAt: new Date().toISOString()
  };

  const newAgent = {
    id: agentId,
    userId,
    shopName,
    shopSlug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    shopDescription: shopDescription || 'Newly registered vendor on Tech Marketplace',
    city,
    address,
    contactPhone: phone,
    status: AgentStatus.PENDING, // Pending admin approval
    isVerified: false,
    rating: 5.0,
    ratingCount: 0,
    productCount: 0
  };

  store.users.push(newUser);
  store.agents.push(newAgent);

  const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        agentProfile: newAgent,
        createdAt: newUser.createdAt
      }
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res) => {
  const user = store.users.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  const agent = store.agents.find(a => a.userId === user.id);

  return res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      agentProfile: agent,
      createdAt: user.createdAt
    }
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
