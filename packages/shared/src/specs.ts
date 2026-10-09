import { z } from 'zod';

export type SpecFieldType = 'text' | 'number' | 'select' | 'boolean';

export interface SpecFieldDefinition {
  key: string;
  label: string;
  type: SpecFieldType;
  unit?: string;
  options?: string[]; // For select type
  required: boolean;
  filterable: boolean;
  comparable: boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
}

export interface CategorySpecSchema {
  categoryId: string;
  categoryName: string;
  fields: SpecFieldDefinition[];
}

export const SpecFieldDefinitionSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_]+$/, 'Key must be snake_case alphanumeric'),
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['text', 'number', 'select', 'boolean']),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  filterable: z.boolean().default(false),
  comparable: z.boolean().default(false),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  placeholder: z.string().optional()
});

export const CategorySpecSchemaSchema = z.object({
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  fields: z.array(SpecFieldDefinitionSchema)
});

// Default pre-seeded schemas for core tech categories
export const DEFAULT_CATEGORY_SPECS: Record<string, CategorySpecSchema> = {
  mobiles: {
    categoryId: 'cat_mobiles',
    categoryName: 'Mobiles',
    fields: [
      { key: 'ram_gb', label: 'RAM', type: 'select', unit: 'GB', options: ['4', '6', '8', '12', '16', '24'], required: true, filterable: true, comparable: true },
      { key: 'storage_gb', label: 'Storage', type: 'select', unit: 'GB', options: ['64', '128', '256', '512', '1024'], required: true, filterable: true, comparable: true },
      { key: 'battery_mah', label: 'Battery', type: 'number', unit: 'mAh', required: true, filterable: true, comparable: true, placeholder: 'e.g. 5000' },
      { key: 'screen_size_inch', label: 'Screen Size', type: 'number', unit: 'inches', required: true, filterable: true, comparable: true, placeholder: 'e.g. 6.7' },
      { key: 'camera_mp', label: 'Main Camera', type: 'text', unit: 'MP', required: true, filterable: true, comparable: true, placeholder: 'e.g. 50 MP + 12 MP' },
      { key: 'chipset', label: 'Chipset / Processor', type: 'text', required: true, filterable: true, comparable: true, placeholder: 'e.g. Snapdragon 8 Gen 3' },
      { key: 'network', label: 'Network Support', type: 'select', options: ['4G LTE', '5G'], required: true, filterable: true, comparable: true },
      { key: 'pta_approved', label: 'PTA Status', type: 'select', options: ['Official PTA Approved', 'Non-PTA', 'CPID / Patch'], required: true, filterable: true, comparable: true }
    ]
  },
  laptops: {
    categoryId: 'cat_laptops',
    categoryName: 'Laptops',
    fields: [
      { key: 'cpu', label: 'Processor (CPU)', type: 'text', required: true, filterable: true, comparable: true, placeholder: 'e.g. Intel Core i7-14700H / Apple M3' },
      { key: 'ram_gb', label: 'RAM', type: 'select', unit: 'GB', options: ['8', '16', '32', '64'], required: true, filterable: true, comparable: true },
      { key: 'storage_gb', label: 'SSD Storage', type: 'select', unit: 'GB', options: ['256', '512', '1024', '2048'], required: true, filterable: true, comparable: true },
      { key: 'gpu', label: 'Graphics Card (GPU)', type: 'text', required: false, filterable: true, comparable: true, placeholder: 'e.g. RTX 4070 8GB / Integrated' },
      { key: 'screen_size_inch', label: 'Display Size', type: 'select', unit: 'inches', options: ['13.3', '14.0', '15.6', '16.0', '17.3'], required: true, filterable: true, comparable: true },
      { key: 'screen_refresh_rate', label: 'Refresh Rate', type: 'select', unit: 'Hz', options: ['60', '120', '144', '165', '240'], required: false, filterable: true, comparable: true },
      { key: 'weight_kg', label: 'Weight', type: 'number', unit: 'kg', required: false, filterable: false, comparable: true, placeholder: 'e.g. 1.6' }
    ]
  },
  accessories: {
    categoryId: 'cat_accessories',
    categoryName: 'Accessories & Wearables',
    fields: [
      { key: 'accessory_type', label: 'Accessory Type', type: 'select', options: ['Smartwatch', 'Earbuds / Headphones', 'Power Bank', 'Charger & Cable', 'Keyboard / Mouse'], required: true, filterable: true, comparable: true },
      { key: 'connectivity', label: 'Connectivity', type: 'select', options: ['Bluetooth', 'Wireless 2.4GHz', 'Wired Type-C', 'Wired Lightning'], required: true, filterable: true, comparable: true },
      { key: 'battery_life_hours', label: 'Battery Life', type: 'number', unit: 'hours', required: false, filterable: true, comparable: true, placeholder: 'e.g. 30' },
      { key: 'warranty_months', label: 'Warranty Duration', type: 'select', unit: 'months', options: ['No Warranty', '1 Month', '3 Months', '6 Months', '12 Months'], required: true, filterable: true, comparable: true }
    ]
  }
};
