import { apiClient } from "./apiClient";

export interface ReceiptVerificationResult {
  valid: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export const receiptService = {
  async getForTransaction(transactionId: string) {
    const result = await apiClient.get<{ receipt?: string } | string>(`/api/transactions/${encodeURIComponent(transactionId)}/receipt`);
    const receipt = typeof result === "string" ? result : result.receipt;
    if (!receipt) throw new Error("The backend did not return a receipt.");
    return { receipt };
  },
  async verify(receipt: string): Promise<ReceiptVerificationResult> {
    const result = await apiClient.post<Record<string, unknown>>("/api/transactions/receipt/verify", { receipt });
    const verification = asRecord(result.verification);
    const valid = result.valid ?? result.is_valid ?? verification.valid ?? verification.is_valid;
    const payload = result.payload ?? result.receipt_payload ?? verification.payload;
    const error = result.error ?? result.message ?? verification.error;
    return {
      valid: valid === true,
      payload: Object.keys(asRecord(payload)).length > 0 ? asRecord(payload) : undefined,
      error: typeof error === "string" ? error : undefined,
    };
  },
};
