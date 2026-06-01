import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PRODUCTS } from "./mockData";
import type {
  AuditLog,
  CartItem,
  Order,
  Product,
  ProviderEvent,
  Receipt,
  RefundRequest,
  Transaction,
  User,
} from "./types";
import {
  adminService,
  authService,
  configService,
  orderService,
  paymentService,
  receiptService,
  refundService,
  transactionService,
  type MockRefundOutcome,
  type PaymentIntentResult,
  type PublicConfig,
} from "../services";
import { mapAuditLog, mapOrder, mapProvider, mapTransaction } from "../utils/statusMapper";

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  address: string;
  citizenId: string;
}

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
  refundRequestsLoading: boolean;
  refundRequestsError: string | null;
  publicConfig: PublicConfig;
  dataLoading: boolean;
  apiError: string | null;

  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterInput) => Promise<User>;
  logout: () => void;
  refreshData: () => Promise<void>;
  refreshRefundRequests: () => Promise<RefundRequest[]>;
  loadOrder: (orderId: string) => Promise<Order>;

  addToCart: (productId: string, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrderFromCart: (shippingAddress: string) => Promise<Order>;

  payForOrder: (orderId: string, provider: "stripe" | "mock_bank", paymentToken: string) => Promise<PaymentIntentResult>;
  syncPayment: (paymentIntentId: string) => Promise<Record<string, any>>;
  verifyReceiptForTransaction: (transactionId: string) => Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }>;
  refundTransaction: (transactionId: string, reason: string) => Promise<Record<string, any>>;

  submitRefundRequest: (input: { orderId: string; reason: string; details?: string }) => Promise<RefundRequest>;
  cancelRefundRequest: (id: string) => Promise<RefundRequest>;
  approveRefundRequest: (id: string, mockRefundOutcome?: MockRefundOutcome) => Promise<RefundRequest>;
  rejectRefundRequest: (id: string, adminNote: string) => Promise<RefundRequest>;
}

const DEFAULT_CONFIG: PublicConfig = {
  environment: "production",
  providers: { stripe: false, mock_bank: false },
  connected: false,
};

const AppContext = createContext<AppState | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected API error.";
}

function receiptFromTransaction(raw: Record<string, any>): Receipt | null {
  if (!raw.jws_receipt) return null;
  return {
    id: raw.id,
    transactionId: raw.id,
    orderId: raw.order_id,
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "VND").toUpperCase(),
    issuedAt: raw.created_at,
    status: "issued",
    rawJws: raw.jws_receipt,
  };
}

function linkTransactions(orders: Order[], transactions: Transaction[]): Order[] {
  return orders.map((order) => {
    const transaction = transactions.find((item) => item.orderId === order.id);
    return transaction
      ? { ...order, transactionId: transaction.id, provider: order.provider ?? transaction.provider }
      : order;
  });
}

function upsertRefundRequest(requests: RefundRequest[], request: RefundRequest): RefundRequest[] {
  return [request, ...requests.filter((candidate) => candidate.id !== request.id)];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products] = useState<Product[]>(PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [providerEvents] = useState<ProviderEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [refundRequestsLoading, setRefundRequestsLoading] = useState(false);
  const [refundRequestsError, setRefundRequestsError] = useState<string | null>(null);
  const [publicConfig, setPublicConfig] = useState<PublicConfig>(DEFAULT_CONFIG);
  const [dataLoading, setDataLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    configService.getPublicConfig().then(setPublicConfig).catch((error) => {
      setApiError(errorMessage(error));
      setPublicConfig(DEFAULT_CONFIG);
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (!authService.getToken()) return;
    setDataLoading(true);
    setApiError(null);
    try {
      const [rawOrders, rawTransactions] = await Promise.all([
        orderService.listMine(),
        transactionService.listMine(),
      ]);
      const nextTransactions = rawTransactions.map((transaction) => mapTransaction(transaction, user));
      setTransactions(nextTransactions);
      setOrders(linkTransactions(rawOrders.map((order) => mapOrder(order, user)), nextTransactions));
      setReceipts(rawTransactions.map(receiptFromTransaction).filter((receipt): receipt is Receipt => !!receipt));

      if (user?.role === "admin") {
        const logs = await adminService.listAuditLogs();
        setAuditLogs(logs.map(mapAuditLog));
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      setApiError(errorMessage(error));
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  const refreshRefundRequests = useCallback(async () => {
    if (!authService.getToken() || !user) {
      setRefundRequests([]);
      return [];
    }
    setRefundRequestsLoading(true);
    setRefundRequestsError(null);
    try {
      const requests = user.role === "admin"
        ? await refundService.adminListRefundRequests()
        : await refundService.listMyRefundRequests();
      setRefundRequests(requests);
      return requests;
    } catch (error) {
      setRefundRequestsError(errorMessage(error));
      return [];
    } finally {
      setRefundRequestsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void refreshData();
      void refreshRefundRequests();
    }
    else {
      setOrders([]);
      setTransactions([]);
      setReceipts([]);
      setAuditLogs([]);
      setRefundRequests([]);
      setRefundRequestsError(null);
    }
  }, [user, refreshData, refreshRefundRequests]);

  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await authService.login(email, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const nextUser = await authService.register(data);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { productId, quantity }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, quantity: number) => {
    setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const createOrderFromCart = useCallback(async (shippingAddress: string) => {
    const items = cart.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new Error("A product in your cart is no longer available.");
      return { productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: product.price };
    });
    const raw = await orderService.createOrder({
      items,
      shippingAddress,
      totalAmount: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    });
    const order = mapOrder(raw, user);
    setOrders((current) => [order, ...current]);
    clearCart();
    return order;
  }, [cart, clearCart, products, user]);

  const loadOrder = useCallback(async (orderId: string) => {
    const raw = await orderService.getById(orderId);
    const mapped = mapOrder(raw, user);
    let merged = mapped;
    setOrders((current) => {
      const existing = current.find((order) => order.id === orderId);
      merged = existing?.items.length ? { ...mapped, items: existing.items } : mapped;
      return existing ? current.map((order) => order.id === orderId ? merged : order) : [merged, ...current];
    });
    return merged;
  }, [user]);

  const payForOrder = useCallback(async (orderId: string, provider: "stripe" | "mock_bank", paymentToken: string) => {
    const order = orders.find((candidate) => candidate.id === orderId) ?? await loadOrder(orderId);
    try {
      return await paymentService.createIntent({ orderId, provider, paymentToken, amount: order.amount });
    } finally {
      await refreshData();
    }
  }, [loadOrder, orders, refreshData]);

  const syncPayment = useCallback(async (paymentIntentId: string) => {
    const result = await paymentService.sync(paymentIntentId);
    await refreshData();
    return result;
  }, [refreshData]);

  const verifyReceiptForTransaction = useCallback(async (transactionId: string) => {
    const { receipt } = await receiptService.getForTransaction(transactionId);
    return receiptService.verify(receipt);
  }, []);

  const refundTransaction = useCallback(async (transactionId: string, reason: string) => {
    const result = await refundService.refundTransaction(transactionId, reason);
    await refreshData();
    return result;
  }, [refreshData]);

  const submitRefundRequest = useCallback(async (input: { orderId: string; reason: string; details?: string }) => {
    const request = await refundService.createRefundRequest(input.orderId, input.reason, input.details);
    setRefundRequests((current) => upsertRefundRequest(current, request));
    await refreshRefundRequests();
    return request;
  }, [refreshRefundRequests]);

  const cancelRefundRequest = useCallback(async (id: string) => {
    const request = await refundService.cancelRefundRequest(id);
    setRefundRequests((current) => upsertRefundRequest(current, request));
    await refreshRefundRequests();
    return request;
  }, [refreshRefundRequests]);

  const approveRefundRequest = useCallback(async (id: string, mockRefundOutcome?: MockRefundOutcome) => {
    try {
      const response = await refundService.adminApproveRefundRequest(id, mockRefundOutcome);
      const requests = await refreshRefundRequests();
      return requests.find((candidate) => candidate.id === id) ?? response;
    } catch (error) {
      const requests = await refreshRefundRequests();
      const request = requests.find((candidate) => candidate.id === id);
      if (request?.status === "provider_failed") return request;
      throw error;
    }
  }, [refreshRefundRequests]);

  const rejectRefundRequest = useCallback(async (id: string, adminNote: string) => {
    const request = await refundService.adminRejectRefundRequest(id, adminNote);
    setRefundRequests((current) => upsertRefundRequest(current, request));
    await refreshRefundRequests();
    return request;
  }, [refreshRefundRequests]);

  const value = useMemo<AppState>(() => ({
    user, cart, products, orders, transactions, receipts, providerEvents, auditLogs, refundRequests,
    publicConfig, dataLoading, apiError, refundRequestsLoading, refundRequestsError,
    login, register, logout, refreshData, refreshRefundRequests, loadOrder,
    addToCart, updateCartQty, removeFromCart, clearCart, createOrderFromCart,
    payForOrder, syncPayment, verifyReceiptForTransaction, refundTransaction,
    submitRefundRequest, cancelRefundRequest, approveRefundRequest, rejectRefundRequest,
  }), [
    user, cart, products, orders, transactions, receipts, providerEvents, auditLogs, refundRequests,
    publicConfig, dataLoading, apiError, refundRequestsLoading, refundRequestsError,
    login, register, logout, refreshData, refreshRefundRequests, loadOrder,
    addToCart, updateCartQty, removeFromCart, clearCart, createOrderFromCart,
    payForOrder, syncPayment, verifyReceiptForTransaction, refundTransaction,
    submitRefundRequest, cancelRefundRequest, approveRefundRequest, rejectRefundRequest,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
