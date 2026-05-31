import type { Product, Order, Transaction, Receipt, ProviderEvent, AuditLog } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "p_starter",
    name: "Secure Payment Starter Kit",
    description: "Everything you need to accept payments securely.",
    longDescription:
      "A complete starter kit including SDK access, sandbox credentials, and integration guides. Designed for teams building their first secure checkout.",
    price: 2_490_000,
    category: "Kits",
    image:
      "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    sold: 1240,
  },
  {
    id: "p_token",
    name: "Hardware Security Token",
    description: "FIDO2 hardware key for strong multi-factor authentication.",
    longDescription:
      "USB-C / NFC hardware authenticator certified for strong customer authentication. Tamper-resistant secure element with FIDO2 support.",
    price: 1_190_000,
    category: "Devices",
    image:
      "https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    sold: 845,
  },
  {
    id: "p_data",
    name: "Encrypted Data Package",
    description: "Encrypted storage bundle with key management.",
    longDescription:
      "Cloud-backed encrypted storage with envelope encryption and managed keys. Includes role-based access policies and detailed activity logs.",
    price: 3_990_000,
    category: "Cloud",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    sold: 412,
  },
  {
    id: "p_gateway",
    name: "Gateway Integration Package",
    description: "Production integration with priority support.",
    longDescription:
      "Production-grade payment gateway integration package with priority engineering support, code samples, and a dedicated sandbox environment.",
    price: 7_500_000,
    category: "Integration",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    sold: 318,
  },
  {
    id: "p_course",
    name: "Online Security Course",
    description: "12 modules covering payments and application security.",
    longDescription:
      "A self-paced online course with 12 modules covering application security, secure payments, and compliance. Includes practical labs and a certificate of completion.",
    price: 990_000,
    category: "Learning",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    rating: 4.5,
    sold: 2103,
  },
  {
    id: "p_audit",
    name: "Compliance Audit Bundle",
    description: "Pre-audit toolkit for PCI DSS readiness.",
    longDescription:
      "Templates, evidence checklists, and reporting tools to streamline PCI DSS readiness. Built with input from compliance practitioners.",
    price: 5_290_000,
    category: "Compliance",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
    rating: 4.4,
    sold: 196,
  },
];

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();

export const SEED_ORDERS: Order[] = [
  {
    id: "ord_8f3a92b1",
    customerEmail: "linh.nguyen@example.com",
    customerName: "Linh Nguyen",
    items: [
      { productId: "p_starter", name: "Secure Payment Starter Kit", unitPrice: 2_490_000, quantity: 1 },
    ],
    amount: 2_490_000,
    status: "paid",
    provider: "stripe",
    shippingAddress: "12 Le Loi, District 1, Ho Chi Minh City",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    transactionId: "txn_a1b2c3d4",
    timeline: [
      { label: "Created", at: daysAgo(3), done: true },
      { label: "Awaiting payment", at: daysAgo(3), done: true },
      { label: "Processing", at: daysAgo(3), done: true },
      { label: "Paid", at: daysAgo(3), done: true },
    ],
  },
  {
    id: "ord_7a01ee29",
    customerEmail: "minh.tran@example.com",
    customerName: "Minh Tran",
    items: [
      { productId: "p_token", name: "Hardware Security Token", unitPrice: 1_190_000, quantity: 2 },
    ],
    amount: 2_380_000,
    status: "processing",
    provider: "sandbox_bank",
    shippingAddress: "88 Hai Ba Trung, Hoan Kiem, Hanoi",
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(2),
    transactionId: "txn_b2c3d4e5",
    timeline: [
      { label: "Created", at: hoursAgo(6), done: true },
      { label: "Awaiting payment", at: hoursAgo(5), done: true },
      { label: "Processing", at: hoursAgo(2), done: true },
      { label: "Paid", at: "", done: false },
    ],
  },
  {
    id: "ord_5d20f4c7",
    customerEmail: "huy.le@example.com",
    customerName: "Huy Le",
    items: [
      { productId: "p_gateway", name: "Gateway Integration Package", unitPrice: 7_500_000, quantity: 1 },
    ],
    amount: 7_500_000,
    status: "refunded",
    provider: "stripe",
    shippingAddress: "5 Nguyen Hue, District 1, Ho Chi Minh City",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(8),
    transactionId: "txn_c3d4e5f6",
    timeline: [
      { label: "Created", at: daysAgo(12), done: true },
      { label: "Awaiting payment", at: daysAgo(12), done: true },
      { label: "Paid", at: daysAgo(12), done: true },
      { label: "Refunded", at: daysAgo(8), done: true },
    ],
  },
  {
    id: "ord_3c91ab44",
    customerEmail: "trang.pham@example.com",
    customerName: "Trang Pham",
    items: [
      { productId: "p_course", name: "Online Security Course", unitPrice: 990_000, quantity: 1 },
      { productId: "p_data", name: "Encrypted Data Package", unitPrice: 3_990_000, quantity: 1 },
    ],
    amount: 4_980_000,
    status: "failed",
    provider: "sandbox_bank",
    shippingAddress: "21 Tran Hung Dao, Da Nang",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    transactionId: "txn_d4e5f6a7",
    timeline: [
      { label: "Created", at: daysAgo(1), done: true },
      { label: "Awaiting payment", at: daysAgo(1), done: true },
      { label: "Failed", at: daysAgo(1), done: true },
    ],
  },
  {
    id: "ord_2b88aa11",
    customerEmail: "an.vu@example.com",
    customerName: "An Vu",
    items: [
      { productId: "p_audit", name: "Compliance Audit Bundle", unitPrice: 5_290_000, quantity: 1 },
    ],
    amount: 5_290_000,
    status: "awaiting_payment",
    provider: "stripe",
    shippingAddress: "14 Vo Van Tan, District 3, Ho Chi Minh City",
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
    timeline: [
      { label: "Created", at: hoursAgo(1), done: true },
      { label: "Awaiting payment", at: hoursAgo(1), done: true },
    ],
  },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_a1b2c3d4",
    orderId: "ord_8f3a92b1",
    customerEmail: "linh.nguyen@example.com",
    provider: "stripe",
    providerReference: "pi_3OqL8c2eZvKYlo2C1abc",
    amount: 2_490_000,
    status: "succeeded",
    refundStatus: "none",
    createdAt: daysAgo(3),
    receiptId: "rcpt_a1b2c3d4",
  },
  {
    id: "txn_b2c3d4e5",
    orderId: "ord_7a01ee29",
    customerEmail: "minh.tran@example.com",
    provider: "sandbox_bank",
    providerReference: "sb_ref_77819ABC",
    amount: 2_380_000,
    status: "processing",
    refundStatus: "none",
    createdAt: hoursAgo(6),
  },
  {
    id: "txn_c3d4e5f6",
    orderId: "ord_5d20f4c7",
    customerEmail: "huy.le@example.com",
    provider: "stripe",
    providerReference: "pi_3OqL8c2eZvKYlo2C9xyz",
    amount: 7_500_000,
    status: "refunded",
    refundStatus: "processed",
    createdAt: daysAgo(12),
    refundedAt: daysAgo(8),
    refundReason: "Customer requested cancellation",
    receiptId: "rcpt_c3d4e5f6",
  },
  {
    id: "txn_d4e5f6a7",
    orderId: "ord_3c91ab44",
    customerEmail: "trang.pham@example.com",
    provider: "sandbox_bank",
    providerReference: "sb_ref_91283DEF",
    amount: 4_980_000,
    status: "failed",
    refundStatus: "none",
    createdAt: daysAgo(1),
  },
];

export const SEED_RECEIPTS: Receipt[] = [
  {
    id: "rcpt_a1b2c3d4",
    transactionId: "txn_a1b2c3d4",
    orderId: "ord_8f3a92b1",
    amount: 2_490_000,
    currency: "VND",
    issuedAt: daysAgo(3),
    status: "issued",
    rawJws:
      "eyJhbGciOiJSUzI1NiIsImtpZCI6InJjcHQta2V5LTAxIn0.eyJ0eG4iOiJ0eG5fYTFiMmMzZDQiLCJvcmQiOiJvcmRfOGYzYTkyYjEiLCJhbXQiOjI0OTAwMDAsImNjeSI6IlZORCJ9.SIG-PLACEHOLDER",
  },
  {
    id: "rcpt_c3d4e5f6",
    transactionId: "txn_c3d4e5f6",
    orderId: "ord_5d20f4c7",
    amount: 7_500_000,
    currency: "VND",
    issuedAt: daysAgo(12),
    status: "issued",
    rawJws:
      "eyJhbGciOiJSUzI1NiIsImtpZCI6InJjcHQta2V5LTAxIn0.eyJ0eG4iOiJ0eG5fYzNkNGU1ZjYiLCJvcmQiOiJvcmRfNWQyMGY0YzciLCJhbXQiOjc1MDAwMDAsImNjeSI6IlZORCJ9.SIG-PLACEHOLDER",
  },
];

export const SEED_PROVIDER_EVENTS: ProviderEvent[] = [
  {
    id: "evt_01H8X9", provider: "stripe", eventType: "payment_intent.succeeded",
    paymentReference: "pi_3OqL8c2eZvKYlo2C1abc", status: "processed",
    receivedAt: daysAgo(3), processedAt: daysAgo(3),
    rawPayload: "{ \"id\": \"evt_01H8X9\", \"type\": \"payment_intent.succeeded\" }",
  },
  {
    id: "evt_01H8XB", provider: "stripe", eventType: "payment_intent.payment_failed",
    paymentReference: "pi_3OqL8c2eZvKYlo2C9def", status: "failed",
    receivedAt: hoursAgo(20), processedAt: hoursAgo(20),
    error: "Order not found for payment reference",
    rawPayload: "{ \"id\": \"evt_01H8XB\", \"type\": \"payment_intent.payment_failed\" }",
  },
  {
    id: "evt_01H8XC", provider: "sandbox_bank", eventType: "payment.completed",
    paymentReference: "sb_ref_77819ABC", status: "processed",
    receivedAt: hoursAgo(2), processedAt: hoursAgo(2),
    rawPayload: "{ \"ref\": \"sb_ref_77819ABC\", \"status\": \"completed\" }",
  },
  {
    id: "evt_01H8XD", provider: "stripe", eventType: "charge.refunded",
    paymentReference: "pi_3OqL8c2eZvKYlo2C9xyz", status: "processed",
    receivedAt: daysAgo(8), processedAt: daysAgo(8),
    rawPayload: "{ \"id\": \"evt_01H8XD\", \"type\": \"charge.refunded\" }",
  },
  {
    id: "evt_01H8XE", provider: "stripe", eventType: "payment_intent.succeeded",
    paymentReference: "pi_3OqL8c2eZvKYlo2C1abc", status: "duplicate",
    receivedAt: daysAgo(3), processedAt: daysAgo(3),
    rawPayload: "{ \"id\": \"evt_01H8XE\", \"duplicate_of\": \"evt_01H8X9\" }",
  },
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: "log_001", at: daysAgo(3), actor: "system", event: "payment.completed", entity: "txn_a1b2c3d4", result: "success", integrity: "ok", payload: "{...}" },
  { id: "log_002", at: hoursAgo(2), actor: "system", event: "provider.callback.processed", entity: "evt_01H8XC", result: "success", integrity: "ok", payload: "{...}" },
  { id: "log_003", at: hoursAgo(20), actor: "system", event: "provider.callback.failed", entity: "evt_01H8XB", result: "error", integrity: "ok", payload: "{...}" },
  { id: "log_004", at: daysAgo(8), actor: "admin@securepay.io", event: "refund.processed", entity: "txn_c3d4e5f6", result: "success", integrity: "ok", payload: "{...}" },
  { id: "log_005", at: daysAgo(1), actor: "linh.nguyen@example.com", event: "receipt.verify", entity: "rcpt_a1b2c3d4", result: "success", integrity: "ok", payload: "{...}" },
  { id: "log_006", at: hoursAgo(4), actor: "minh.tran@example.com", event: "order.access.denied", entity: "ord_5d20f4c7", result: "denied", integrity: "ok", payload: "{ reason: 'cross-user access' }" },
  { id: "log_007", at: hoursAgo(1), actor: "admin@securepay.io", event: "admin.payment.sync", entity: "ord_7a01ee29", result: "success", integrity: "ok", payload: "{...}" },
];
