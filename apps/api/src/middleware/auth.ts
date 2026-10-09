import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@tech-marketplace/shared';
import { store } from '../data/mockStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tech_marketplace_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    agentId?: string;
  };
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = store.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Session invalid' }
      });
    }

    const agent = store.agents.find(a => a.userId === user.id);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      agentId: agent?.id
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Session expired or invalid' }
    });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' }
      });
    }

    next();
  };
}
