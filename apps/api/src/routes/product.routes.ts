import { Router } from 'express';
import {
  ProductFilterQuerySchema,
  ProductCondition,
  ProductStatus
} from '@tech-marketplace/shared';
import { store } from '../data/mockStore.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/products (Public catalog with dynamic spec filtering, sorting, pagination)
router.get('/', (req, res) => {
  const queryResult = ProductFilterQuerySchema.safeParse(req.query);
  const query = queryResult.success ? queryResult.data : { page: 1, limit: 20, sort: 'newest' as const };

  let list = store.products.filter(p => p.status === ProductStatus.PUBLISHED);

  if (query.category) {
    const cat = store.categories.find(c => c.slug === query.category || c.id === query.category);
    if (cat) {
      list = list.filter(p => p.categoryId === cat.id);
    }
  }

  if (query.brand) {
    list = list.filter(p => p.brand.toLowerCase() === query.brand!.toLowerCase());
  }

  if (query.condition) {
    list = list.filter(p => p.condition === query.condition);
  }

  if (query.agentId) {
    list = list.filter(p => p.agentId === query.agentId);
  }

  if (query.minPrice !== undefined) {
    list = list.filter(p => p.basePrice >= query.minPrice!);
  }

  if (query.maxPrice !== undefined) {
    list = list.filter(p => p.basePrice <= query.maxPrice!);
  }

  if (query.search) {
    const s = query.search.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      p.description.toLowerCase().includes(s) ||
      p.agentShopName.toLowerCase().includes(s)
    );
  }

  // Dynamic spec filters (e.g. ram_gb, storage_gb, etc.)
  if (req.query) {
    Object.keys(req.query).forEach(paramKey => {
      if (['category', 'brand', 'condition', 'agentId', 'minPrice', 'maxPrice', 'sort', 'page', 'limit', 'search'].includes(paramKey)) {
        return;
      }
      const val = req.query[paramKey];
      if (val) {
        list = list.filter(p => {
          const specVal = p.specs?.[paramKey];
          if (specVal === undefined || specVal === null) return false;
          return String(specVal).toLowerCase() === String(val).toLowerCase();
        });
      }
    });
  }

  // Sorting
  if (query.sort === 'price_asc') {
    list.sort((a, b) => a.basePrice - b.basePrice);
  } else if (query.sort === 'price_desc') {
    list.sort((a, b) => b.basePrice - a.basePrice);
  } else if (query.sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else {
    // Newest
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = list.slice((page - 1) * limit, page * limit);

  return res.json({
    success: true,
    data: paginated,
    meta: {
      page,
      limit,
      total,
      totalPages
    }
  });
});

// GET /api/products/compare?ids=prod_1,prod_2
router.get('/compare', (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean);
  if (!ids.length) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'No product IDs specified' } });
  }

  const matched = store.products.filter(p => ids.includes(p.id));
  return res.json({
    success: true,
    data: matched
  });
});

// GET /api/products/:slugOrId
router.get('/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const product = store.products.find(p => p.slug === slugOrId || p.id === slugOrId);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Product not found' }
    });
  }

  const category = store.categories.find(c => c.id === product.categoryId);
  const agent = store.agents.find(a => a.id === product.agentId);
  const related = store.products.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  const reviews = store.reviews.filter(r => r.productId === product.id);

  return res.json({
    success: true,
    data: {
      ...product,
      category,
      agent,
      related,
      reviews
    }
  });
});

// POST /api/products/:id/reviews (Add customer review)
router.post('/:id/reviews', authenticate, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const product = store.products.find(p => p.id === id || p.slug === id);
  if (!product) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }

  const newReview = {
    id: `rev_${Date.now()}`,
    productId: product.id,
    userId: req.user!.id,
    userName: req.user!.name,
    rating: Number(rating) || 5,
    comment: String(comment || 'Great authentic device!'),
    verifiedPurchase: true,
    createdAt: new Date().toISOString()
  };

  store.reviews.unshift(newReview);
  product.reviewCount += 1;

  return res.status(201).json({
    success: true,
    data: newReview
  });
});

export default router;
