import { Router } from 'express';
import { store } from '../data/mockStore.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/customer/wallet
router.get('/wallet', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const ledgers = store.walletLedgers.filter(w => w.userId === userId);
  const currentBalance = ledgers.reduce((acc, curr) => acc + curr.amount, 0);

  return res.json({
    success: true,
    data: {
      balance: currentBalance,
      ledgers: ledgers.reverse()
    }
  });
});

export default router;
