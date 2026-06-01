import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { StatusBadge } from "../../components/StatusBadge";
import {
  adminService,
  receiptService,
  SECURITY_EVIDENCE_CONTROLS,
  type SecurityEvidence,
  type SecurityEvidenceStatus,
} from "../../services";
import { RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";

interface ReceiptResult {
  valid: boolean;
  error?: string;
}

export default function SecurityOps() {
  const [evidence, setEvidence] = useState<SecurityEvidence[] | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState("");
  const [receiptResult, setReceiptResult] = useState<ReceiptResult | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const loadEvidence = useCallback(async () => {
    setEvidenceLoading(true);
    setEvidenceError(null);
    try {
      setEvidence(await adminService.getSecurityEvidence());
    } catch (error) {
      setEvidence(null);
      setEvidenceError(error instanceof Error ? error.message : "Unable to load security evidence.");
    } finally {
      setEvidenceLoading(false);
    }
  }, []);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((item) => <EvidenceCard key={item.id} evidence={item} loading={evidenceLoading} />)}
      </div>

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
