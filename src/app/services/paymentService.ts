import type { PaymentProvider } from "../lib/types";
import { apiClient } from "./apiClient";

export interface PaymentIntentResult {
  clientSecret?: string | null;
  paymentIntentId: string;
  paymentAttemptId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  status: string;
  amount?: number;
  currency?: string;
  idempotent?: boolean;
}

export interface CreatePaymentIntentInput {
  orderId: string;
  provider: PaymentProvider;
  paymentToken: string;
  nonce?: string;
  timestamp?: number;
  idempotencyKey?: string;
}

function readString(...values: unknown[]): string {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.length > 0);
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function mapPaymentIntentResult(raw: Record<string, unknown>): PaymentIntentResult {
  const attempt = asRecord(raw.paymentAttempt ?? raw.payment_attempt);
  const providerPaymentId = readString(
    raw.providerPaymentId,
    raw.provider_payment_id,
    raw.paymentIntentId,
    raw.payment_intent_id,
    attempt.provider_payment_id,
    attempt.providerPaymentId,
  );
  const provider = raw.provider ?? attempt.provider;
  const amount = Number(raw.amount ?? attempt.amount);

  return {
    clientSecret: readString(raw.clientSecret, raw.client_secret, attempt.client_secret) || null,
    paymentIntentId: readString(raw.paymentIntentId, raw.payment_intent_id, providerPaymentId),
    paymentAttemptId: readString(raw.paymentAttemptId, raw.payment_attempt_id, attempt.id),
    provider: provider === "mock_bank" ? "mock_bank" : "stripe",
    providerPaymentId,
    status: readString(raw.status, attempt.status),
    amount: Number.isFinite(amount) ? amount : undefined,
    currency: readString(raw.currency, attempt.currency) || undefined,
    idempotent: raw.idempotent === true,
  };
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
  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const result = await apiClient.post<Record<string, unknown>>("/api/payments/create-intent", {
      orderId: input.orderId,
      provider: input.provider,
      paymentToken: input.paymentToken,
      nonce: input.nonce ?? crypto.randomUUID(),
      timestamp: input.timestamp ?? await getServerTimestamp(),
      idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
    });
    return mapPaymentIntentResult(result);
  },
  async sync(providerPaymentId: string) {
    return apiClient.post<Record<string, any>>(`/api/payments/sync/${encodeURIComponent(providerPaymentId)}`);
  },
};
