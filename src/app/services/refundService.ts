import { apiClient } from "./apiClient";

export const refundService = {
  async refundTransaction(transactionId: string, reason: string) {
    return apiClient.post<Record<string, any>>("/api/payments/refund", { transactionId, reason });
  },
};
