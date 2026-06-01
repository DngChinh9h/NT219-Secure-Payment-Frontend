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

export type SecurityHardeningStatus = "enabled" | "disabled" | "warning" | "not_reported";

export interface SecurityHardeningItem {
  id: string;
  title: string;
  status: SecurityHardeningStatus;
  details: string;
  lastCheckedAt?: string;
}

export interface SecurityHardening {
  controls: SecurityHardeningItem[];
  attackEvidence: SecurityHardeningItem[];
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

export const SECURITY_HARDENING_CONTROLS = [
  { id: "rate_limiting", title: "Rate limiting", aliases: ["rate_limit", "rate_limit_enabled", "rate_limiting_enabled"], detailsAliases: ["rate_limit", "rate_limiting"] },
  { id: "cors_restriction", title: "CORS restriction", aliases: ["cors", "cors_restricted", "cors_restriction"], detailsAliases: ["cors", "cors_restriction"] },
  { id: "security_headers", title: "Security headers", aliases: ["security_headers", "security_headers_enabled"], detailsAliases: ["security_headers"] },
  { id: "replay_protection", title: "Replay protection", aliases: ["replay_protection", "replay_protection_enabled"], detailsAliases: ["replay_protection"] },
  { id: "duplicate_payment_protection", title: "Duplicate payment protection", aliases: ["duplicate_payment_protection", "duplicate_payment_protection_enabled"], detailsAliases: ["duplicate_payment_protection"] },
  { id: "refund_double_spend_protection", title: "Refund double-spend protection", aliases: ["refund_double_spend_protection", "refund_double_spend_protection_enabled"], detailsAliases: ["refund_double_spend_protection"] },
  { id: "webhook_idempotency", title: "Webhook idempotency", aliases: ["webhook_idempotency", "webhook_idempotency_enabled"], detailsAliases: ["webhook_idempotency"] },
  { id: "secret_scan_status", title: "Secret scan status / recommendation", aliases: ["secret_scan_status", "secret_scan_enabled", "secret_scan_recommended"], detailsAliases: ["secret_scan", "secret_scan_status"] },
] as const;

const ATTACK_EVIDENCE_CONTROLS = [
  { id: "replay_duplicate_blocked", title: "Replay duplicate blocked", aliases: ["replay_duplicate_blocked", "replay_blocked"] },
  { id: "duplicate_payment_blocked", title: "Duplicate payment blocked", aliases: ["duplicate_payment_blocked"] },
  { id: "duplicate_refund_request_blocked", title: "Duplicate refund request blocked", aliases: ["duplicate_refund_request_blocked", "duplicate_refund_blocked"] },
  { id: "duplicate_approve_blocked", title: "Duplicate approve blocked", aliases: ["duplicate_approve_blocked", "duplicate_refund_approve_blocked"] },
  { id: "customer_admin_api_blocked", title: "Customer cannot access admin APIs", aliases: ["customer_admin_api_blocked", "customer_cannot_access_admin_apis", "customer_admin_access_blocked"] },
] as const;

function normalizeKey(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function normalizedEntries(value: unknown): Map<string, unknown> {
  if (Array.isArray(value)) {
    return new Map(value.map((item) => {
      const record = asRecord(item);
      return [normalizeKey(String(record.id ?? record.key ?? record.control ?? record.name ?? record.title ?? "")), item];
    }));
  }
  return new Map(Object.entries(asRecord(value)).map(([key, item]) => [normalizeKey(key), item]));
}

function firstValue(source: Map<string, unknown>, aliases: readonly string[]): unknown {
  return aliases.map((alias) => source.get(normalizeKey(alias))).find((value) => value !== undefined);
}

function checkedAt(value: unknown, fallback?: string): string | undefined {
  const record = asRecord(value);
  const candidate = record.lastCheckedAt ?? record.last_checked_at ?? record.checkedAt ?? record.checked_at ?? record.timestamp ?? fallback;
  return typeof candidate === "string" ? candidate : undefined;
}

function hardeningStatus(value: unknown, recommendation = false): SecurityHardeningStatus {
  if (recommendation && value === true) return "warning";
  if (value === true) return "enabled";
  if (value === false) return "disabled";
  const record = asRecord(value);
  const statusValue = record.status ?? record.result ?? record.state ?? record.blocked ?? record.passed ?? record.enabled ?? record.protected;
  if (recommendation && statusValue === true) return "warning";
  if (statusValue === true) return "enabled";
  if (statusValue === false) return "disabled";
  const normalized = normalizeKey(String(statusValue ?? value ?? ""));
  if (["enabled", "blocked", "protected", "passed", "pass", "success", "ok", "valid"].includes(normalized)) return "enabled";
  if (["disabled", "failed", "fail", "error", "invalid", "unblocked"].includes(normalized)) return "disabled";
  if (["warning", "recommended", "recommendation", "partial", "pending"].includes(normalized)) return "warning";
  return "not_reported";
}

function hardeningDetails(value: unknown, status: SecurityHardeningStatus): string {
  const record = asRecord(value);
  const direct = record.details ?? record.detail ?? record.description ?? record.message ?? record.recommendation ?? record.mechanism;
  if (typeof direct === "string") return direct;
  const policyNames = Object.keys(asRecord(record.policies));
  if (policyNames.length > 0) return `Configured policies: ${policyNames.join(", ")}.`;
  const origins = Array.isArray(record.allowedOrigins) ? record.allowedOrigins.filter((origin) => typeof origin === "string") : [];
  if (origins.length > 0) return `Allowed origins: ${origins.join(", ")}.`;
  if (status === "not_reported") return "No hardening evidence returned by the backend.";
  return `Backend reports this control as ${status}.`;
}

function mapSecurityHardening(raw: unknown): SecurityHardening {
  const response = asRecord(raw);
  const details = normalizedEntries(response.details);
  const controls = normalizedEntries(response.controls ?? response.checks ?? response);
  const topLevelCheckedAt = checkedAt(response);

  const mappedControls = SECURITY_HARDENING_CONTROLS.map((control) => {
    const value = firstValue(controls, control.aliases);
    const detail = firstValue(details, control.detailsAliases);
    const reported = value ?? detail;
    const status = hardeningStatus(
      reported,
      control.id === "secret_scan_status" && controls.has("secret_scan_recommended"),
    );
    return {
      id: control.id,
      title: control.title,
      status,
      details: hardeningDetails(detail ?? reported, status),
      lastCheckedAt: checkedAt(detail ?? reported, topLevelCheckedAt),
    };
  });

  const attackSource = response.attackEvidence ?? response.attack_evidence ?? response.attacks ?? response.attackResults ?? response.attack_results;
  const attacks = normalizedEntries(attackSource);
  const attackEvidence = ATTACK_EVIDENCE_CONTROLS.flatMap((control) => {
    const value = firstValue(attacks, control.aliases);
    if (value === undefined) return [];
    const status = hardeningStatus(value);
    return [{
      id: control.id,
      title: control.title,
      status,
      details: hardeningDetails(value, status),
      lastCheckedAt: checkedAt(value, topLevelCheckedAt),
    }];
  });

  return { controls: mappedControls, attackEvidence };
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
  async getSecurityHardening() {
    const result = await apiClient.get<unknown>("/api/admin/security/hardening");
    return mapSecurityHardening(result);
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
