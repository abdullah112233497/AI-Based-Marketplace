import { Router } from 'express';
import { store } from '../data/mockStore.js';

const router = Router();

// GET /api/categories
router.get('/', (req, res) => {
  return res.json({
    success: true,
    data: store.categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      productCount: store.products.filter(p => p.categoryId === c.id).length
    }))
  });
});

// GET /api/categories/:slug/specs
router.get('/:slug/specs', (req, res) => {
  const { slug } = req.params;
  const category = store.categories.find(c => c.slug === slug || c.id === slug);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Category not found' }
    });
  }

  return res.json({
    success: true,
    data: category.specSchema
  });
});

export default router;
