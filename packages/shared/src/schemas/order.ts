import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '../enums.js';

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full recipient name is required'),
  phone: z.string().min(10, 'Contact phone number is required'),
  streetAddress: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().default('Pakistan'),
  postalCode: z.string().optional()
});

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1)
});

export const CreateOrderSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'Cart is empty'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  applyWalletAmount: z.number().int().min(0).default(0),
  notes: z.string().optional()
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().optional(),
  courierName: z.string().optional(),
  cancellationReason: z.string().optional()
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
