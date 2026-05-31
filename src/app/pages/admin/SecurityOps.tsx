import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { StatusBadge } from "../../components/StatusBadge";
import { adminService, receiptService } from "../../services";
import { Shield, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

interface CheckResult { name: string; status: "success" | "failed"; actual: string; }

export default function SecurityOps() {
  const [receipt, setReceipt] = useState("");
  const [results, setResults] = useState<CheckResult[]>([]);

  const add = (result: CheckResult) => setResults((current) => [result, ...current]);
  const verifyAudit = async () => {
    try {
      const result = await adminService.verifyAuditTrail();
      add({ name: "Audit trail integrity", status: result.valid ? "success" : "failed", actual: result.valid ? `${result.checked} records verified` : `Integrity failure at ${result.failedAt}` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify audit trail.");
    }
  };
  const verifyReceipt = async () => {
    if (!receipt.trim()) return;
    try {
      const result = await receiptService.verify(receipt.trim());
      add({ name: "Receipt authenticity", status: result.valid ? "success" : "failed", actual: result.valid ? "Receipt signature is valid" : result.error ?? "Receipt signature is invalid" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify receipt.");
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Security operations</h1><p className="text-sm text-slate-500">Run checks backed by live security endpoints.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Health title="Audit trail integrity" status="connected" />
        <Health title="Receipt authenticity" status="connected" />
        <Health title="Provider callback processing" status="not connected" />
        <Health title="Duplicate payment protection" status="not connected" />
        <Health title="Refund protection" status="not connected" />
        <Health title="Access control checks" status="not connected" />
      </div>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200"><CardHeader><CardTitle className="text-base">Audit trail integrity</CardTitle></CardHeader><CardContent><Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={verifyAudit}><FileCheck2 className="mr-2 h-4 w-4" />Verify audit trail</Button></CardContent></Card>
        <Card className="border-slate-200"><CardHeader><CardTitle className="text-base">Receipt authenticity</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea rows={4} value={receipt} onChange={(event) => setReceipt(event.target.value)} placeholder="Paste a receipt to verify..." /><Button onClick={verifyReceipt}>Verify receipt</Button></CardContent></Card>
        <Card className="border-slate-200 lg:col-span-2"><CardHeader><CardTitle className="text-base">Check results</CardTitle></CardHeader><CardContent className="p-0">{results.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">Run a connected check to see results here.</div> : <ul className="divide-y divide-slate-100">{results.map((result, index) => <li key={`${result.name}-${index}`} className="flex items-center justify-between px-4 py-3 text-sm"><div><div className="font-medium">{result.name}</div><div className="text-xs text-slate-500">{result.actual}</div></div><StatusBadge status={result.status} /></li>)}</ul>}</CardContent></Card>
      </section>
    </div>
  );
}

function Health({ title, status }: { title: string; status: "connected" | "not connected" }) {
  return <Card className="border-slate-200"><CardContent className="space-y-3 p-5"><div className="flex items-center justify-between"><div className="text-sm font-medium">{title}</div><Shield className="h-4 w-4 text-indigo-600" /></div><StatusBadge status={status === "connected" ? "healthy" : "unchecked"}>{status}</StatusBadge></CardContent></Card>;
}
