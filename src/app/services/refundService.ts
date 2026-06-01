import { apiClient } from "./apiClient";
import type { PaymentProvider, RefundRequest, RefundRequestStatus } from "../lib/types";

export type MockRefundOutcome = "success" | "pending" | "failed";

function mapStatus(status?: string): RefundRequestStatus {
  if (status === "refunded") return "succeeded";
  if (
    status === "pending_review"
    || status === "approved_processing"
    || status === "provider_pending"
    || status === "succeeded"
    || status === "provider_failed"
    || status === "cancelled"
    || status === "rejected"
  ) {
    return status;
  }
  return "unknown";
}

function mapProvider(provider?: string): PaymentProvider | undefined {
  return provider === "stripe" || provider === "mock_bank" ? provider : undefined;
}

function mapRefundRequest(raw: Record<string, any>): RefundRequest {
  return {
    id: raw.id,
    orderId: raw.order_id ?? raw.orderId,
    transactionId: raw.transaction_id ?? raw.transactionId,
    customerId: raw.user_id ?? raw.userId ?? raw.customerId,
    customerEmail: raw.user_email ?? raw.userEmail ?? raw.customer_email ?? raw.customerEmail,
    amount: Number(raw.amount ?? 0),
    provider: mapProvider(raw.provider),
    reason: raw.reason ?? "",
    details: raw.details ?? undefined,
    status: mapStatus(raw.status),
    submittedAt: raw.created_at ?? raw.submittedAt ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? raw.created_at ?? new Date().toISOString(),
    reviewedAt: raw.reviewed_at ?? raw.reviewedAt ?? undefined,
    reviewedBy: raw.reviewed_by ?? raw.reviewedBy ?? undefined,
    rejectionReason: raw.admin_note ?? raw.adminNote ?? raw.rejectionReason ?? undefined,
    internalNote: raw.admin_note ?? raw.adminNote ?? raw.internalNote ?? undefined,
    providerMessage: raw.provider_error ?? raw.providerError ?? raw.providerMessage ?? undefined,
    refundedAt: raw.transaction_refunded_at ?? raw.transactionRefundedAt ?? raw.refunded_at ?? raw.refundedAt ?? undefined,
    refundTxnRef: raw.provider_refund_id ?? raw.providerRefundId ?? raw.transaction_refund_id ?? raw.transactionRefundId ?? raw.refundTxnRef ?? undefined,
  };
}

export const refundService = {
  async refundTransaction(transactionId: string, reason: string) {
    return apiClient.post<Record<string, any>>("/api/payments/refund", { transactionId, reason });
  },
  async createRefundRequest(orderId: string, reason: string, details?: string) {
    const result = await apiClient.post<{ refundRequest: Record<string, any> }>("/api/refund-requests", {
      orderId,
      reason,
      details,
    });
    return mapRefundRequest(result.refundRequest);
  },
  async listMyRefundRequests() {
    const result = await apiClient.get<{ refundRequests: Record<string, any>[] }>("/api/refund-requests/mine");
    return result.refundRequests.map(mapRefundRequest);
  },
  async cancelRefundRequest(refundRequestId: string) {
    const result = await apiClient.post<{ refundRequest: Record<string, any> }>(
      `/api/refund-requests/${encodeURIComponent(refundRequestId)}/cancel`,
    );
    return mapRefundRequest(result.refundRequest);
  },
  async adminListRefundRequests() {
    const result = await apiClient.get<{ refundRequests: Record<string, any>[] }>("/api/admin/refund-requests");
    return result.refundRequests.map(mapRefundRequest);
  },
  async adminApproveRefundRequest(refundRequestId: string, mockRefundOutcome?: MockRefundOutcome) {
    const result = await apiClient.post<{ refundRequest: Record<string, any> }>(
      `/api/admin/refund-requests/${encodeURIComponent(refundRequestId)}/approve`,
      mockRefundOutcome ? { mockRefundOutcome } : {},
    );
    return mapRefundRequest(result.refundRequest);
  },
  async adminRejectRefundRequest(refundRequestId: string, adminNote: string) {
    const result = await apiClient.post<{ refundRequest: Record<string, any> }>(
      `/api/admin/refund-requests/${encodeURIComponent(refundRequestId)}/reject`,
      { adminNote },
    );
    return mapRefundRequest(result.refundRequest);
  },
};
