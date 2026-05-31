import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

export default function AdminRefunds() {
  const { refundTransaction } = useApp();
  const [transactionId, setTransactionId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [refundId, setRefundId] = useState<string | null>(null);

  const refund = async () => {
    if (!transactionId.trim() || !reason.trim()) return;
    setBusy(true);
    try {
      const result = await refundTransaction(transactionId.trim(), reason.trim());
      setRefundId(String(result.refundId ?? ""));
      toast.success("Refund processed by the provider.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process refund.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">Refunds</h1><p className="text-sm text-slate-500">Process an eligible transaction refund directly with the payment provider.</p></div>
      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Direct refund</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="transaction-id">Transaction ID</Label><Input id="transaction-id" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Transaction UUID" /></div>
          <div className="space-y-1.5"><Label htmlFor="refund-reason">Reason</Label><Textarea id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason sent to the provider" /></div>
          <Button disabled={busy || !transactionId.trim() || !reason.trim()} onClick={refund}>{busy ? "Processing..." : "Process refund"}</Button>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Customer refund-request approval and rejection API is not connected yet. This form calls the backend direct-refund endpoint only.</div>
          {refundId && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Refund ID: <span className="font-mono">{refundId}</span></div>}
        </CardContent>
      </Card>
    </div>
  );
}
