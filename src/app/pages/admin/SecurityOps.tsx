import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { StatusBadge } from "../../components/StatusBadge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  adminService,
  receiptService,
  SECURITY_EVIDENCE_CONTROLS,
  SECURITY_HARDENING_CONTROLS,
  type ReceiptSigningKeyStatus,
  type SecurityEvidence,
  type SecurityEvidenceStatus,
  type SecurityHardening,
  type SecurityHardeningItem,
  type SecurityHardeningStatus,
} from "../../services";
import { KeyRound, RefreshCw, RotateCcw, Shield, ShieldCheck } from "lucide-react";
import { formatDate } from "../../lib/format";
import { toast } from "sonner";

interface ReceiptResult {
  valid: boolean;
  error?: string;
}

export default function SecurityOps() {
  const [evidence, setEvidence] = useState<SecurityEvidence[] | null>(null);
  const [hardening, setHardening] = useState<SecurityHardening | null>(null);
  const [keyStatus, setKeyStatus] = useState<ReceiptSigningKeyStatus | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [hardeningError, setHardeningError] = useState<string | null>(null);
  const [keyStatusError, setKeyStatusError] = useState<string | null>(null);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [rotateLoading, setRotateLoading] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [receiptResult, setReceiptResult] = useState<ReceiptResult | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const loadEvidence = useCallback(async () => {
    setEvidenceLoading(true);
    setEvidenceError(null);
    setHardeningError(null);
    setKeyStatusError(null);
    try {
      const [evidenceResult, hardeningResult, keyStatusResult] = await Promise.allSettled([
        adminService.getSecurityEvidence(),
        adminService.getSecurityHardening(),
        adminService.getReceiptSigningKeyStatus(),
      ]);
      if (evidenceResult.status === "fulfilled") {
        setEvidence(evidenceResult.value);
      } else {
        setEvidence(null);
        setEvidenceError(evidenceResult.reason instanceof Error ? evidenceResult.reason.message : "Unable to load security evidence.");
      }
      if (hardeningResult.status === "fulfilled") {
        setHardening(hardeningResult.value);
      } else {
        setHardening(null);
        setHardeningError(hardeningResult.reason instanceof Error ? hardeningResult.reason.message : "Unable to load security hardening evidence.");
      }
      if (keyStatusResult.status === "fulfilled") {
        setKeyStatus(keyStatusResult.value);
      } else {
        setKeyStatus(null);
        setKeyStatusError(keyStatusResult.reason instanceof Error ? keyStatusResult.reason.message : "Unable to load receipt signing key status.");
      }
    } finally {
      setEvidenceLoading(false);
    }
  }, []);

  const rotateKey = async () => {
    setRotateLoading(true);
    setKeyStatusError(null);
    try {
      await adminService.rotateReceiptSigningKey();
      toast.success("Receipt signing key rotated.");
      await loadEvidence();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to rotate receipt signing key.";
      setKeyStatusError(message);
      toast.error(message);
    } finally {
      setRotateLoading(false);
      setRotateDialogOpen(false);
    }
  };

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  const verifyReceipt = async () => {
    if (!receipt.trim()) return;
    setReceiptLoading(true);
    setReceiptResult(null);
    try {
      const result = await receiptService.verify(receipt.trim());
      setReceiptResult({ valid: result.valid, error: result.error });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify receipt.";
      setReceiptResult({ valid: false, error: message });
      toast.error(message);
    } finally {
      setReceiptLoading(false);
    }
  };

  const cards = evidence ?? SECURITY_EVIDENCE_CONTROLS.map((control) => ({
    id: control.id,
    title: control.title,
    status: "not_connected" as const,
  }));
  const hardeningCards = hardening?.controls ?? SECURITY_HARDENING_CONTROLS.map((control) => ({
    id: control.id,
    title: control.title,
    status: "not_reported" as const,
    details: "No hardening evidence returned by the backend.",
  }));
  const receiptSigningStatus = evidence?.find((item) => item.id === "receipt_signature_verification")?.status;
  const receiptSigningLabel = evidenceLoading
    ? "Loading..."
    : receiptSigningStatus === "passed"
      ? "Enabled"
      : receiptSigningStatus === "failed"
        ? "Disabled"
        : "Not connected";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Security operations</h1>
          <p className="text-sm text-slate-500">Inspect evidence returned by live security endpoints.</p>
        </div>
        <Button variant="outline" disabled={evidenceLoading} onClick={() => void loadEvidence()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {evidenceLoading ? "Refreshing..." : "Refresh evidence"}
        </Button>
      </div>

      {evidenceError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Security evidence is not connected: {evidenceError}
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Receipt signing keys</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Live metadata only. Private signing keys are never returned by the API.</p>
          </div>
          <KeyRound className="h-5 w-5 text-indigo-600" />
        </CardHeader>
        <CardContent className="space-y-4">
          {keyStatusError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Receipt signing key status is not connected: {keyStatusError}
            </div>
          )}
          <div className="grid gap-3 text-sm sm:grid-cols-4">
            <Metric label="Receipt signing enabled" value={receiptSigningLabel} />
            <Metric label="Current key version" value={keyStatus ? String(keyStatus.activeKeyVersion) : evidenceLoading ? "Loading..." : "—"} testId="active-key-version" />
            <Metric label="Available key versions" value={keyStatus ? keyStatus.availableKeyVersions.join(", ") : evidenceLoading ? "Loading..." : "—"} />
            <Metric label="Key rotation enabled" value={keyStatus ? keyStatus.keyRotationEnabled ? "Enabled" : "Disabled" : evidenceLoading ? "Loading..." : "Not connected"} />
          </div>
          <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={evidenceLoading || rotateLoading || !keyStatus?.keyRotationEnabled}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Rotate key
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rotate receipt signing key?</AlertDialogTitle>
                <AlertDialogDescription>
                  New receipts will use a new key version. Existing receipts remain verifiable with their original public key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={rotateLoading}>Cancel</AlertDialogCancel>
                <Button disabled={rotateLoading} onClick={() => void rotateKey()}>
                  {rotateLoading ? "Rotating..." : "Confirm rotation"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => <EvidenceCard key={item.id} evidence={item} loading={evidenceLoading} />)}
      </div>

      <section className="space-y-4" aria-labelledby="security-hardening-title">
        <div>
          <h2 id="security-hardening-title" className="text-xl font-semibold tracking-tight">Security Hardening</h2>
          <p className="text-sm text-slate-500">Inspect hardening controls returned by the live admin security API.</p>
        </div>
        {hardeningError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Security hardening evidence is not connected: {hardeningError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hardeningCards.map((item) => <HardeningCard key={item.id} item={item} loading={evidenceLoading} />)}
        </div>
      </section>

      {hardening && hardening.attackEvidence.length > 0 && (
        <section className="space-y-4" aria-labelledby="attack-evidence-title">
          <div>
            <h2 id="attack-evidence-title" className="text-xl font-semibold tracking-tight">Attack Evidence</h2>
            <p className="text-sm text-slate-500">Observed attack-blocking results returned by the backend.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hardening.attackEvidence.map((item) => <HardeningCard key={item.id} item={item} loading={evidenceLoading} />)}
          </div>
        </section>
      )}

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Receipt signature verification</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={5}
            value={receipt}
            onChange={(event) => setReceipt(event.target.value)}
            placeholder="Paste a JWS receipt to verify..."
          />
          <Button disabled={receiptLoading || !receipt.trim()} onClick={() => void verifyReceipt()}>
            {receiptLoading ? "Verifying..." : "Verify receipt"}
          </Button>
          {receiptResult && (
            <div className={`rounded-md border p-3 text-sm ${receiptResult.valid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{receiptResult.valid ? "Receipt signature is valid." : "Receipt signature is invalid."}</span>
                <StatusBadge status={receiptResult.valid ? "success" : "failed"} />
              </div>
              {receiptResult.error && <div className="mt-1 text-xs">{receiptResult.error}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HardeningCard({ item, loading }: { item: SecurityHardeningItem; loading: boolean }) {
  const status = loading ? "not_reported" : item.status;
  return (
    <Card className="border-slate-200" data-testid={`hardening-${item.id}`}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium">{item.title}</div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />
        </div>
        <StatusBadge status={hardeningTone(status)}>
          {loading ? "Loading..." : hardeningLabel(status)}
        </StatusBadge>
        <div className="text-xs text-slate-500">{item.details}</div>
        {item.lastCheckedAt && (
          <div className="text-[11px] text-slate-400">Last checked: {formatDate(item.lastCheckedAt)}</div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-medium" data-testid={testId}>{value}</div>
    </div>
  );
}

function hardeningTone(status: SecurityHardeningStatus): string {
  if (status === "enabled") return "healthy";
  if (status === "disabled") return "failed";
  if (status === "warning") return "warning";
  return "unchecked";
}

function hardeningLabel(status: SecurityHardeningStatus): string {
  if (status === "enabled") return "Enabled";
  if (status === "disabled") return "Disabled";
  if (status === "warning") return "Warning";
  return "Not reported";
}

function EvidenceCard({ evidence, loading }: { evidence: SecurityEvidence; loading: boolean }) {
  const status = loading ? "unknown" : evidence.status;
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium">{evidence.title}</div>
          <Shield className="h-4 w-4 shrink-0 text-indigo-600" />
        </div>
        <StatusBadge status={badgeTone(status)}>{loading ? "Loading..." : evidenceLabel(status)}</StatusBadge>
        {evidence.details && <div className="text-xs text-slate-500">{evidence.details}</div>}
      </CardContent>
    </Card>
  );
}

function badgeTone(status: SecurityEvidenceStatus): string {
  if (status === "passed") return "healthy";
  if (status === "failed") return "failed";
  if (status === "warning") return "warning";
  return "unchecked";
}

function evidenceLabel(status: SecurityEvidenceStatus): string {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  if (status === "warning") return "Warning";
  if (status === "not_connected") return "Not connected";
  return "Unknown";
}
