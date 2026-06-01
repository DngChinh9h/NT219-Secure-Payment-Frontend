export type OrderStatus = "created" | "awaiting_payment" | "processing" | "paid" | "failed" | "refunded";
export type TransactionStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded";
export type PaymentProvider = "stripe" | "mock_bank";
export type ProviderEventStatus = "received" | "processed" | "failed" | "duplicate";
export type RefundStatus = "none" | "requested" | "processed" | "rejected";
export type HealthStatus = "healthy" | "warning" | "failed" | "unchecked";

export interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  sold: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  provider?: PaymentProvider;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  timeline: { label: string; at: string; done: boolean }[];
}

export interface Transaction {
  id: string;
  orderId: string;
  customerEmail: string;
  provider: PaymentProvider;
  providerReference: string;
  amount: number;
  status: TransactionStatus;
  refundStatus: RefundStatus;
  createdAt: string;
  receiptId?: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface Receipt {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  issuedAt: string;
  status: "issued" | "verified" | "invalid";
  rawJws: string;
}

export interface ProviderEvent {
  id: string;
  provider: PaymentProvider;
  eventType: string;
  paymentReference: string;
  status: ProviderEventStatus;
  receivedAt: string;
  processedAt?: string;
  error?: string;
  rawPayload: string;
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  event: string;
  entity: string;
  result: "success" | "denied" | "error";
  integrity: "ok" | "broken";
  payload: string;
}

export type RefundRequestStatus =
  | "pending_review"
  | "approved_processing"
  | "provider_pending"
  | "succeeded"
  | "rejected"
  | "provider_failed"
  | "cancelled"
  | "unknown";

export interface RefundRequest {
  id: string;
  orderId: string;
  transactionId?: string;
  customerId?: string;
  customerEmail?: string;
  amount: number;
  provider?: PaymentProvider;
  reason: string;
  details?: string;
  status: RefundRequestStatus;
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  internalNote?: string;
  providerMessage?: string;
  refundedAt?: string;
  refundTxnRef?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  address?: string;
  citizenId?: string;
  role: "customer" | "admin";
}
