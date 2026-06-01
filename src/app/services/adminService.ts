import { apiClient } from "./apiClient";

export type SecurityEvidenceStatus = "passed" | "failed" | "warning" | "not_connected" | "unknown";

export interface SecurityEvidence {
  id: string;
  title: string;
  status: SecurityEvidenceStatus;
  details?: string;
}

export interface AuditChainVerification {
  valid: boolean;
  checked: number;
  brokenAt?: string;
  verifiedAt?: string;
}

export interface ReceiptSigningKeyStatus {
  activeKeyVersion: number;
  availableKeyVersions: number[];
  availablePublicKeyVersions?: number[];
  keyRotationEnabled: boolean;
  keyStoreReady?: boolean;
}

export const SECURITY_EVIDENCE_CONTROLS = [
  { id: "receipt_signature_verification", aliases: ["receipt_signature", "receipt_verification", "receipt_signing"], title: "Receipt signature verification" },
  { id: "audit_hash_chain", aliases: ["audit_chain", "audit_trail_integrity"], title: "Audit hash chain" },
  { id: "duplicate_payment_protection", aliases: ["duplicate_payment", "duplicate_payments"], title: "Duplicate payment protection" },
  { id: "replay_protection", aliases: ["payment_replay_protection", "replay_attack_protection"], title: "Replay protection" },
  { id: "refund_double_spend_protection", aliases: ["refund_double_spend", "double_spend_protection"], title: "Refund double-spend protection" },
  { id: "webhook_idempotency", aliases: ["webhook_duplicate_protection"], title: "Webhook idempotency" },
  { id: "provider_refund_processing", aliases: ["provider_refunds", "provider_refund"], title: "Provider refund processing" },
] as const;

function normalizeKey(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function normalizeStatus(value: unknown): SecurityEvidenceStatus {
  if (value === true) return "passed";
  if (value === false) return "failed";
  const normalized = normalizeKey(String(value ?? ""));
  if (["pass", "passed", "ok", "valid", "healthy", "protected", "enabled", "connected", "success"].includes(normalized)) return "passed";
  if (["fail", "failed", "invalid", "broken", "error"].includes(normalized)) return "failed";
  if (["warning", "partial", "pending"].includes(normalized)) return "warning";
  if (["not_connected", "unsupported", "unavailable"].includes(normalized)) return "not_connected";
  return "unknown";
}

function evidenceDetails(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const details = record.details ?? record.detail ?? record.description ?? record.message;
  return typeof details === "string" ? details : undefined;
}

function mapEvidence(raw: unknown): SecurityEvidence[] {
  const response = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const source = response.evidence ?? response.checks ?? response.controls ?? response;
  const entries = Array.isArray(source)
    ? source.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return [normalizeKey(String(record.id ?? record.key ?? record.control ?? record.name ?? record.title ?? "")), item] as const;
    })
    : Object.entries(source && typeof source === "object" ? source as Record<string, unknown> : {})
      .map(([key, value]) => [normalizeKey(key), value] as const);
  const byKey = new Map(entries);

  return SECURITY_EVIDENCE_CONTROLS.map((control) => {
    const value = [control.id, ...control.aliases].map((key) => byKey.get(key)).find((candidate) => candidate !== undefined);
    const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const statusValue = value && typeof value === "object"
      ? record.status ?? record.result ?? record.state ?? record.valid ?? record.passed ?? record.connected ?? record.implemented ?? record.available ?? record.enabled ?? record.protected
      : value;
    return {
      id: control.id,
      title: control.title,
      status: value === undefined ? "unknown" : normalizeStatus(statusValue),
      details: evidenceDetails(value),
    };
  });
}

export const adminService = {
  async listAuditLogs() {
    const result = await apiClient.get<{ logs: Record<string, any>[] }>("/api/transactions/audit-logs");
    return result.logs;
  },
  async verifyAuditTrail() {
    return apiClient.get<{ valid: boolean; checked: number; failedAt?: string }>("/api/transactions/audit-logs/verify");
  },
  async getSecurityEvidence() {
    const result = await apiClient.get<unknown>("/api/admin/security/evidence");
    return mapEvidence(result);
  },
  async getReceiptSigningKeyStatus() {
    return apiClient.get<ReceiptSigningKeyStatus>("/api/admin/security/keys/status");
  },
  async rotateReceiptSigningKey() {
    return apiClient.post<ReceiptSigningKeyStatus>("/api/admin/security/keys/rotate");
  },
  async verifySecurityAuditChain(): Promise<AuditChainVerification> {
    const result = await apiClient.get<Record<string, unknown>>("/api/admin/security/audit-chain/verify");
    const nested = result.verification ?? result.auditChain ?? result.audit_chain;
    const source = nested && typeof nested === "object" ? nested as Record<string, unknown> : result;
    return {
      valid: source.valid === true,
      checked: Number(source.checked ?? source.logsChecked ?? source.count ?? 0),
      brokenAt: typeof (source.brokenAt ?? source.failedAt) === "string" ? String(source.brokenAt ?? source.failedAt) : undefined,
      verifiedAt: typeof (source.verifiedAt ?? source.checkedAt ?? source.timestamp) === "string"
        ? String(source.verifiedAt ?? source.checkedAt ?? source.timestamp)
        : undefined,
    };
  },
};
