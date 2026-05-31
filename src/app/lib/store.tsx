import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  PRODUCTS,
  SEED_AUDIT_LOGS,
  SEED_ORDERS,
  SEED_PROVIDER_EVENTS,
  SEED_RECEIPTS,
  SEED_TRANSACTIONS,
} from "./mockData";
import type {
  AuditLog,
  CartItem,
  Order,
  OrderStatus,
  Product,
  ProviderEvent,
  Receipt,
  RefundRequest,
  Transaction,
  User,
} from "./types";
import { uid } from "./format";

interface AppState {
  user: User | null;
  cart: CartItem[];
  products: Product[];
  orders: Order[];
  transactions: Transaction[];
  receipts: Receipt[];
  providerEvents: ProviderEvent[];
  auditLogs: AuditLog[];
  refundRequests: RefundRequest[];

  login: (email: string, password: string) => User;
  loginAsAdmin: () => void;
  register: (data: { email: string; password: string; fullName: string; address: string; citizenId: string }) => User;
  logout: () => void;

  addToCart: (productId: string, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  createOrderFromCart: (shippingAddress: string) => Order;
  setOrderProvider: (orderId: string, provider: "stripe" | "sandbox_bank") => void;
  simulatePayment: (orderId: string, result: "approve" | "decline" | "pending") => { order: Order; transaction: Transaction; receipt?: Receipt };
  requestRefund: (transactionId: string, reason: string) => Transaction;
  syncPayment: (orderId: string) => { before: OrderStatus; after: OrderStatus; duplicatePrevented: boolean };

  submitRefundRequest: (input: { orderId: string; reason: string; details?: string }) => RefundRequest;
  cancelRefundRequest: (id: string) => void;
  approveRefundRequest: (id: string) => void;
  rejectRefundRequest: (id: string, rejectionReason: string, internalNote?: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products] = useState<Product[]>(PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [receipts, setReceipts] = useState<Receipt[]>(SEED_RECEIPTS);
  const [providerEvents, setProviderEvents] = useState<ProviderEvent[]>(SEED_PROVIDER_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);

  const login: AppState["login"] = useCallback((email) => {
    const u: User = { email, fullName: email.split("@")[0], role: "customer" };
    setUser(u);
    return u;
  }, []);

  const loginAsAdmin = useCallback(() => {
    setUser({ email: "admin@securepay.io", fullName: "Operations Admin", role: "admin" });
  }, []);

  const register: AppState["register"] = useCallback((data) => {
    const u: User = { email: data.email, fullName: data.fullName, address: data.address, citizenId: data.citizenId, role: "customer" };
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === productId);
      if (existing) return c.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i));
      return [...c, { productId, quantity }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, quantity: number) => {
    setCart((c) => c.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const pushAudit = useCallback((event: string, entity: string, result: AuditLog["result"] = "success") => {
    setAuditLogs((logs) => [
      { id: "log_" + uid(), at: new Date().toISOString(), actor: "system", event, entity, result, integrity: "ok", payload: "{...}" },
      ...logs,
    ]);
  }, []);

  const createOrderFromCart: AppState["createOrderFromCart"] = useCallback((shippingAddress) => {
    const items = cart.map((c) => {
      const p = products.find((p) => p.id === c.productId)!;
      return { productId: p.id, name: p.name, unitPrice: p.price, quantity: c.quantity };
    });
    const amount = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const id = "ord_" + uid();
    const at = new Date().toISOString();
    const order: Order = {
      id,
      customerEmail: user?.email ?? "guest@example.com",
      customerName: user?.fullName ?? "Guest",
      items,
      amount,
      status: "awaiting_payment",
      shippingAddress,
      createdAt: at,
      updatedAt: at,
      timeline: [
        { label: "Created", at, done: true },
        { label: "Awaiting payment", at, done: true },
      ],
    };
    setOrders((o) => [order, ...o]);
    setCart([]);
    pushAudit("order.created", id);
    return order;
  }, [cart, products, user, pushAudit]);

  const setOrderProvider = useCallback((orderId: string, provider: "stripe" | "sandbox_bank") => {
    setOrders((all) => all.map((o) => (o.id === orderId ? { ...o, provider, updatedAt: new Date().toISOString() } : o)));
  }, []);

  const simulatePayment: AppState["simulatePayment"] = useCallback((orderId, result) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    const at = new Date().toISOString();
    const provider = order.provider ?? "sandbox_bank";
    const txnId = "txn_" + uid();
    const providerReference = provider === "stripe" ? "pi_" + uid() : "sb_ref_" + uid().toUpperCase();
    let txnStatus: Transaction["status"];
    let orderStatus: OrderStatus;
    if (result === "approve") { txnStatus = "succeeded"; orderStatus = "paid"; }
    else if (result === "decline") { txnStatus = "failed"; orderStatus = "failed"; }
    else { txnStatus = "processing"; orderStatus = "processing"; }

    const receiptId = txnStatus === "succeeded" ? "rcpt_" + uid() : undefined;
    const transaction: Transaction = {
      id: txnId, orderId, customerEmail: order.customerEmail,
      provider, providerReference, amount: order.amount,
      status: txnStatus, refundStatus: "none", createdAt: at, receiptId,
    };
    let newReceipt: Receipt | undefined;
    if (receiptId) {
      newReceipt = {
        id: receiptId, transactionId: txnId, orderId, amount: order.amount, currency: "VND",
        issuedAt: at, status: "issued",
        rawJws: "eyJhbGciOiJSUzI1NiJ9." + btoa(JSON.stringify({ txn: txnId, ord: orderId, amt: order.amount })) + ".SIG",
      };
      setReceipts((r) => [newReceipt!, ...r]);
    }

    const updatedOrder: Order = {
      ...order,
      provider,
      status: orderStatus,
      updatedAt: at,
      transactionId: txnId,
      timeline: [
        ...order.timeline,
        result === "approve" && { label: "Processing", at, done: true },
        result === "approve" && { label: "Paid", at, done: true },
        result === "decline" && { label: "Failed", at, done: true },
        result === "pending" && { label: "Processing", at, done: true },
      ].filter(Boolean) as Order["timeline"],
    };

    setTransactions((t) => [transaction, ...t]);
    setOrders((all) => all.map((o) => (o.id === orderId ? updatedOrder : o)));
    setProviderEvents((e) => [
      { id: "evt_" + uid(), provider, eventType: txnStatus === "succeeded" ? "payment.succeeded" : txnStatus === "failed" ? "payment.failed" : "payment.processing",
        paymentReference: providerReference, status: "processed", receivedAt: at, processedAt: at,
        rawPayload: JSON.stringify({ ref: providerReference, status: txnStatus }) },
      ...e,
    ]);
    pushAudit("payment." + txnStatus, txnId, txnStatus === "failed" ? "error" : "success");
    return { order: updatedOrder, transaction, receipt: newReceipt };
  }, [orders, pushAudit]);

  const requestRefund: AppState["requestRefund"] = useCallback((transactionId, reason) => {
    const at = new Date().toISOString();
    let updated: Transaction | null = null;
    setTransactions((all) =>
      all.map((t) => {
        if (t.id !== transactionId) return t;
        updated = { ...t, status: "refunded", refundStatus: "processed", refundedAt: at, refundReason: reason };
        return updated;
      }),
    );
    if (updated) {
      setOrders((all) =>
        all.map((o) =>
          o.id === updated!.orderId
            ? { ...o, status: "refunded", updatedAt: at, timeline: [...o.timeline, { label: "Refunded", at, done: true }] }
            : o,
        ),
      );
      setProviderEvents((e) => [
        { id: "evt_" + uid(), provider: updated!.provider, eventType: "charge.refunded",
          paymentReference: updated!.providerReference, status: "processed", receivedAt: at, processedAt: at,
          rawPayload: JSON.stringify({ ref: updated!.providerReference, refunded: true }) },
        ...e,
      ]);
      pushAudit("refund.processed", transactionId);
    }
    return updated!;
  }, [pushAudit]);

  const syncPayment: AppState["syncPayment"] = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Not found");
    const before = order.status;
    const after = order.status === "awaiting_payment" ? "processing" : order.status;
    setOrders((all) => all.map((o) => (o.id === orderId ? { ...o, status: after, updatedAt: new Date().toISOString() } : o)));
    pushAudit("admin.payment.sync", orderId);
    return { before, after, duplicatePrevented: true };
  }, [orders, pushAudit]);

  const submitRefundRequest: AppState["submitRefundRequest"] = useCallback(({ orderId, reason, details }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    const at = new Date().toISOString();
    const req: RefundRequest = {
      id: "rfr_" + uid(),
      orderId,
      transactionId: order.transactionId,
      customerEmail: order.customerEmail,
      amount: order.amount,
      reason,
      details,
      status: "pending_review",
      submittedAt: at,
      updatedAt: at,
    };
    setRefundRequests((all) => [req, ...all]);
    pushAudit("refund.requested", req.id);
    return req;
  }, [orders, pushAudit]);

  const cancelRefundRequest: AppState["cancelRefundRequest"] = useCallback((id) => {
    const at = new Date().toISOString();
    setRefundRequests((all) =>
      all.map((r) => (r.id === id && r.status === "pending_review" ? { ...r, status: "cancelled", updatedAt: at } : r)),
    );
    pushAudit("refund.cancelled", id);
  }, [pushAudit]);

  const approveRefundRequest: AppState["approveRefundRequest"] = useCallback((id) => {
    const at = new Date().toISOString();
    let snapshot: RefundRequest | null = null;
    setRefundRequests((all) =>
      all.map((r) => {
        if (r.id !== id) return r;
        snapshot = { ...r, status: "approved_processing", updatedAt: at, reviewedAt: at, reviewedBy: user?.email ?? "admin" };
        return snapshot;
      }),
    );
    pushAudit("refund.approved", id);
    setTimeout(() => {
      const completedAt = new Date().toISOString();
      let completed: RefundRequest | null = null;
      setRefundRequests((all) =>
        all.map((r) => {
          if (r.id !== id) return r;
          completed = { ...r, status: "refunded", updatedAt: completedAt, refundedAt: completedAt, refundTxnRef: "rf_" + uid() };
          return completed;
        }),
      );
      if (snapshot?.transactionId) {
        setTransactions((ts) =>
          ts.map((t) =>
            t.id === snapshot!.transactionId
              ? { ...t, status: "refunded", refundStatus: "processed", refundedAt: completedAt, refundReason: snapshot!.reason }
              : t,
          ),
        );
      }
      if (snapshot) {
        setOrders((os) =>
          os.map((o) =>
            o.id === snapshot!.orderId
              ? { ...o, status: "refunded", updatedAt: completedAt, timeline: [...o.timeline, { label: "Refunded", at: completedAt, done: true }] }
              : o,
          ),
        );
      }
      pushAudit("refund.completed", id);
    }, 1200);
  }, [pushAudit, user]);

  const rejectRefundRequest: AppState["rejectRefundRequest"] = useCallback((id, rejectionReason, internalNote) => {
    const at = new Date().toISOString();
    setRefundRequests((all) =>
      all.map((r) =>
        r.id === id
          ? { ...r, status: "rejected", updatedAt: at, reviewedAt: at, reviewedBy: user?.email ?? "admin", rejectionReason, internalNote }
          : r,
      ),
    );
    pushAudit("refund.rejected", id);
  }, [pushAudit, user]);

  const value = useMemo<AppState>(() => ({
    user, cart, products, orders, transactions, receipts, providerEvents, auditLogs, refundRequests,
    login, loginAsAdmin, register, logout,
    addToCart, updateCartQty, removeFromCart, clearCart,
    createOrderFromCart, setOrderProvider, simulatePayment, requestRefund, syncPayment,
    submitRefundRequest, cancelRefundRequest, approveRefundRequest, rejectRefundRequest,
  }), [user, cart, products, orders, transactions, receipts, providerEvents, auditLogs, refundRequests,
    login, loginAsAdmin, register, logout,
    addToCart, updateCartQty, removeFromCart, clearCart,
    createOrderFromCart, setOrderProvider, simulatePayment, requestRefund, syncPayment,
    submitRefundRequest, cancelRefundRequest, approveRefundRequest, rejectRefundRequest]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
