import { apiClient } from "./apiClient";

export const transactionService = {
  async listMine() {
    const result = await apiClient.get<{ transactions: Record<string, any>[] }>("/api/transactions/mine");
    return result.transactions;
  },
};
