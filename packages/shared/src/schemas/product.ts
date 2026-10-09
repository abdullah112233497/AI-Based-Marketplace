import { z } from 'zod';
import { ProductCondition, ProductStatus } from '../enums.js';

export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name (e.g. 256GB Titanium Gray)'),
  sku: z.string().optional(),
  price: z.number().int().min(1, 'Price must be greater than 0 (in PKR)'),
  compareAtPrice: z.number().int().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  attributes: z.record(z.string()).default({})
});

export const ProductCreateUpdateSchema = z.object({
  title: z.string().min(3, 'Product title must be at least 3 characters'),
  slug: z.string().optional(),
  description: z.string().min(10, 'Detailed product description required'),
  categoryId: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  condition: z.nativeEnum(ProductCondition),
  conditionDescription: z.string().optional(),
  images: z.array(z.string().url('Must be valid image URL')).min(1, 'At least 1 image is required'),
  basePrice: z.number().int().min(1, 'Price must be in PKR integer amount'),
  compareAtPrice: z.number().int().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.PUBLISHED),
  specs: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  variants: z.array(ProductVariantSchema).default([])
});

export type ProductCreateUpdateInput = z.infer<typeof ProductCreateUpdateSchema>;

export const ProductFilterQuerySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  condition: z.nativeEnum(ProductCondition).optional(),
  agentId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  specs: z.record(z.string()).optional()
});

export type ProductFilterQuery = z.infer<typeof ProductFilterQuerySchema>;
