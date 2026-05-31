import { apiClient } from "./apiClient";

export const adminService = {
  async listAuditLogs() {
    const result = await apiClient.get<{ logs: Record<string, any>[] }>("/api/transactions/audit-logs");
    return result.logs;
  },
  async verifyAuditTrail() {
    return apiClient.get<{ valid: boolean; checked: number; failedAt?: string }>("/api/transactions/audit-logs/verify");
  },
};
