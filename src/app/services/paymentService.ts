import type { PaymentProvider } from "../lib/types";
import { apiClient } from "./apiClient";

export interface PaymentIntentResult {
  clientSecret?: string | null;
  paymentIntentId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  status: string;
}

async function getServerTimestamp(): Promise<number> {
  try {
    const health = await apiClient.get<{ time?: string }>("/health");
    const serverTime = health.time ? Date.parse(health.time) : NaN;
    return Number.isFinite(serverTime) ? serverTime : Date.now();
  } catch {
    return Date.now();
  }
}

export const paymentService = {
  async createIntent(input: { orderId: string; provider: PaymentProvider; paymentToken: string; amount: number }) {
    return apiClient.post<PaymentIntentResult>("/api/payments/create-intent", {
      ...input,
      nonce: crypto.randomUUID(),
      timestamp: await getServerTimestamp(),
    });
  },
  async sync(paymentIntentId: string) {
    return apiClient.post<Record<string, any>>(`/api/payments/sync/${encodeURIComponent(paymentIntentId)}`);
  },
};
