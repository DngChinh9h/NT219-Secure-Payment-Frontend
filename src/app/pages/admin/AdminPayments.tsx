import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { StatusBadge } from "../../components/StatusBadge";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminPayments() {
  const { syncPayment } = useApp();
  const [providerPaymentId, setProviderPaymentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);

  const sync = async () => {
    if (!providerPaymentId.trim()) return;
    setBusy(true);
    try {
      const next = await syncPayment(providerPaymentId.trim());
      setResult(next);
      toast.success("Payment state synced with provider.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sync payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">Payments</h1><p className="text-sm text-slate-500">This page is for manual provider sync by provider payment ID.</p></div>
      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Provider sync</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="provider-payment-id">Provider payment ID</Label>
          <div className="flex gap-2"><Input id="provider-payment-id" value={providerPaymentId} onChange={(event) => setProviderPaymentId(event.target.value)} placeholder="pi_... or mock_pi_..." /><Button disabled={busy || !providerPaymentId.trim()} onClick={sync}><RefreshCw className="mr-2 h-4 w-4" />{busy ? "Syncing..." : "Sync"}</Button></div>
          <div className="text-xs text-slate-500">The backend enforces ownership for customers and permits administrative sync for operators.</div>
        </CardContent>
      </Card>
      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50"><CardHeader><CardTitle className="text-base">Sync result</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Provider" value={<StatusBadge status={String(result.provider)} />} />
          <Row label="Provider status" value={<StatusBadge status={String(result.providerStatus ?? result.provider_status)} />} />
          <Row label="Order status" value={<StatusBadge status={String(result.orderStatus ?? result.order_status)} />} />
          <Row label="Provider payment ID" value={<span className="font-mono text-xs">{String(result.providerPaymentId ?? result.provider_payment_id ?? result.paymentIntentId ?? "â€”")}</span>} />
        </CardContent></Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-emerald-100"><span className="text-slate-500">{label}</span><span>{value}</span></div>;
}
