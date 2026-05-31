import type { AuditLog, Order, OrderStatus, PaymentProvider, Transaction, TransactionStatus, User } from "../lib/types";

export function mapOrderStatus(status?: string): OrderStatus {
  if (status === "pending") return "awaiting_payment";
  if (status === "payment_failed") return "failed";
  if (status === "processing" || status === "paid" || status === "refunded") return status;
  return "created";
}

export function mapTransactionStatus(status?: string): TransactionStatus {
  if (status === "success") return "succeeded";
  if (status === "refunded" || status === "failed" || status === "processing" || status === "pending") return status;
  return "pending";
}

export function mapProvider(provider?: string): PaymentProvider {
  return provider === "mock_bank" ? "mock_bank" : "stripe";
}

function timelineFor(status: OrderStatus, at: string) {
  const labels: Record<OrderStatus, string[]> = {
    created: ["Created"],
    awaiting_payment: ["Created", "Awaiting payment"],
    processing: ["Created", "Awaiting payment", "Processing"],
    paid: ["Created", "Awaiting payment", "Processing", "Paid"],
    failed: ["Created", "Awaiting payment", "Payment failed"],
    refunded: ["Created", "Awaiting payment", "Paid", "Refunded"],
  };
  return labels[status].map((label) => ({ label, at, done: true }));
}

export function mapOrder(raw: Record<string, any>, user?: User | null): Order {
  const createdAt = raw.created_at ?? raw.createdAt ?? new Date().toISOString();
  const updatedAt = raw.updated_at ?? raw.updatedAt ?? createdAt;
  const status = mapOrderStatus(raw.status);
  return {
    id: raw.id,
    customerEmail: raw.customer_email ?? user?.email ?? "",
    customerName: raw.customer_name ?? user?.fullName ?? "",
    items: (raw.items ?? []).filter(Boolean).map((item: Record<string, any>) => ({
      productId: item.product_id ?? item.productId,
      name: item.product_name ?? item.productName ?? item.name,
      unitPrice: Number(item.unit_price ?? item.unitPrice),
      quantity: Number(item.quantity),
    })),
    amount: Number(raw.total_amount ?? raw.amount ?? 0),
    status,
    provider: raw.payment_provider ? mapProvider(raw.payment_provider) : undefined,
    shippingAddress: raw.shipping_address ?? raw.shippingAddress ?? "",
    createdAt,
    updatedAt,
    timeline: timelineFor(status, updatedAt),
  };
}

export function mapTransaction(raw: Record<string, any>, user?: User | null): Transaction {
  const status = mapTransactionStatus(raw.status);
  return {
    id: raw.id,
    orderId: raw.order_id ?? raw.orderId,
    customerEmail: raw.customer_email ?? user?.email ?? "",
    provider: mapProvider(raw.provider),
    providerReference: raw.provider_payment_id ?? raw.stripe_payment_id ?? "",
    amount: Number(raw.amount ?? 0),
    status,
    refundStatus: status === "refunded" ? "processed" : "none",
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    receiptId: raw.jws_receipt ? raw.id : undefined,
    refundedAt: raw.refunded_at ?? undefined,
    refundReason: raw.refund_reason ?? undefined,
  };
}

export function mapAuditLog(raw: Record<string, any>): AuditLog {
  return {
    id: raw.id,
    at: raw.created_at ?? new Date().toISOString(),
    actor: raw.user_id ?? "system",
    event: raw.event_type ?? "unknown",
    entity: raw.payload?.orderId ?? raw.payload?.transactionId ?? raw.payload?.paymentIntentId ?? raw.id,
    result: String(raw.event_type).includes("fail") ? "error" : "success",
    integrity: raw.current_hash ? "ok" : "broken",
    payload: JSON.stringify(raw.payload ?? {}, null, 2),
  };
}
