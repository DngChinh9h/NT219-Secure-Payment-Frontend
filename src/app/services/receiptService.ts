import { apiClient } from "./apiClient";

export const receiptService = {
  async getForTransaction(transactionId: string) {
    return apiClient.get<{ receipt: string }>(`/api/transactions/${encodeURIComponent(transactionId)}/receipt`);
  },
  async verify(receipt: string) {
    return apiClient.post<{ valid: boolean; payload?: Record<string, unknown>; error?: string }>("/api/transactions/receipt/verify", { receipt });
  },
};
