import { UserRole, AgentStatus, ProductCondition, ProductStatus, OrderStatus, PaymentMethod, PaymentStatus, WalletTransactionType } from '../enums.js';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  agentProfile?: AgentSummary;
  createdAt: string;
}

export interface AgentSummary {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  shopDescription?: string;
  city: string;
  address: string;
  contactPhone: string;
  logoUrl?: string;
  bannerUrl?: string;
  status: AgentStatus;
  isVerified: boolean;
  rating: number;
  ratingCount: number;
  productCount: number;
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  condition: ProductCondition;
  conditionDescription?: string;
  images: string[];
  basePrice: number; // in PKR
  compareAtPrice?: number;
  stock: number;
  status: ProductStatus;
  agentId: string;
  agentShopName: string;
  agentCity: string;
  agentIsVerified: boolean;
  specs: Record<string, any>;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  agentId: string;
  agentShopName: string;
}

export interface CartSummary {
  items: CartItem[];
  groupedByAgent: Record<string, { agentName: string; items: CartItem[]; subtotal: number }>;
  itemsSubtotal: number;
  shippingTotal: number;
  walletDiscount: number;
  grandTotal: number;
}

export interface OrderItemSummary {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  agentId: string;
  agentShopName: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItemSummary[];
  subtotal: number;
  shippingFee: number;
  walletDeduction: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    fullName: string;
    phone: string;
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode?: string;
  };
  trackingNumber?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  type: WalletTransactionType;
  description: string;
  referenceOrderId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
