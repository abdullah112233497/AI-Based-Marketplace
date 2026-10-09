export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN'
}

export enum AgentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum ProductCondition {
  NEW = 'NEW',
  USED = 'USED',
  REFURBISHED = 'REFURBISHED'
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
  REJECTED = 'REJECTED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  COD = 'COD',
  WALLET = 'WALLET',
  CARD_DEMO = 'CARD_DEMO'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum WalletTransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUND = 'REFUND',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT'
}

export enum CommissionRuleType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  CATEGORY_BASED = 'CATEGORY_BASED'
}
