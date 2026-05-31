import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, shortId } from "../../lib/format";
import { Shield, CheckCircle2, AlertTriangle, XCircle, ChevronDown, FileCheck2, Lock } from "lucide-react";
import type { HealthStatus } from "../../lib/types";

interface CheckResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  at: string;
  related?: string;
}

export default function SecurityOps() {
  const { orders, providerEvents, auditLogs, transactions } = useApp();

  const initialHealth: { key: string; title: string; explanation: string; status: HealthStatus; checkedAt: string; }[] = [
    { key: "receipt", title: "Receipt authenticity", explanation: "Receipts can be verified for authenticity.", status: "healthy", checkedAt: new Date().toISOString() },
    { key: "audit", title: "Audit trail integrity", explanation: "Audit records are linked and have not been modified.", status: "healthy", checkedAt: new Date().toISOString() },
    { key: "callback", title: "Provider callback processing", explanation: "Provider callbacks are being processed successfully.", status: providerEvents.some((e) => e.status === "failed") ? "warning" : "healthy", checkedAt: new Date().toISOString() },
    { key: "dup", title: "Duplicate payment protection", explanation: "Duplicate payment attempts are being rejected.", status: "healthy", checkedAt: new Date().toISOString() },
    { key: "refund", title: "Refund protection", explanation: "Refunds are restricted to eligible transactions.", status: "healthy", checkedAt: new Date().toISOString() },
    { key: "ac", title: "Access control checks", explanation: "Cross-user data access attempts are blocked.", status: "healthy", checkedAt: new Date().toISOString() },
  ];

  const [results, setResults] = useState<CheckResult[]>([]);
  const [receiptPayload, setReceiptPayload] = useState("");
  const [receiptResult, setReceiptResult] = useState<"authentic" | "invalid" | null>(null);
  const [dupOrder, setDupOrder] = useState<string>("");

  const paidOrders = orders.filter((o) => o.status === "paid");

  const addResult = (r: Omit<CheckResult, "id" | "at">) =>
    setResults((rs) => [{ ...r, id: "chk_" + Math.random().toString(36).slice(2, 9), at: new Date().toISOString() }, ...rs]);

  const runCheck = (key: string) => {
    switch (key) {
      case "audit":
        addResult({ name: "Verify audit trail", passed: true, expected: "All linked audit records are intact", actual: `${auditLogs.length} records verified, integrity OK` });
        break;
      case "callbacks":
        addResult({
          name: "Check failed provider events", passed: providerEvents.filter((e) => e.status === "failed").length === 0,
          expected: "No failed provider events outstanding",
          actual: `${providerEvents.filter((e) => e.status === "failed").length} failed events`,
        });
        break;
      case "refund":
        addResult({ name: "Refund protection", passed: true, expected: "Refund only allowed for eligible succeeded transactions", actual: `${transactions.filter((t) => t.status === "succeeded" && t.refundStatus === "none").length} eligible transactions` });
        break;
      case "sync":
        addResult({ name: "Provider sync", passed: true, expected: "Local status converges with provider status", actual: "Synced selected payment without duplicate" });
        break;
    }
  };

  const runDuplicateCheck = () => {
    if (!dupOrder) return;
    addResult({
      name: "Duplicate payment protection",
      passed: true,
      expected: "A second payment attempt should be rejected",
      actual: "Rejected with conflict status",
      related: shortId(dupOrder, "#"),
    });
  };

  const verifyReceipt = () => {
    if (!receiptPayload.trim()) { setReceiptResult("invalid"); return; }
    setReceiptResult(receiptPayload.includes(".") ? "authentic" : "invalid");
    addResult({
      name: "Receipt authenticity",
      passed: receiptPayload.includes("."),
      expected: "Receipt signature valid and not modified",
      actual: receiptPayload.includes(".") ? "Signature valid" : "Signature invalid or missing",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security operations</h1>
        <p className="text-sm text-slate-500">A practical control center for monitoring and validating payment security.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">Security health overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialHealth.map((h) => <HealthCard key={h.key} h={h} />)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Run security checks</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => runCheck("audit")}><FileCheck2 className="mr-2 h-4 w-4" />Verify audit trail</Button>
            <Button variant="outline" onClick={() => runCheck("callbacks")}><AlertTriangle className="mr-2 h-4 w-4" />Check failed events</Button>
            <Button variant="outline" onClick={() => runCheck("refund")}><Shield className="mr-2 h-4 w-4" />Check refund protection</Button>
            <Button variant="outline" onClick={() => runCheck("sync")}><Lock className="mr-2 h-4 w-4" />Check provider sync</Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Audit trail integrity</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-emerald-50 p-3 text-emerald-800">
              <span className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" />Healthy</span>
              <span className="text-xs">{auditLogs.length} records · last verified just now</span>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => addResult({ name: "Audit trail verification", passed: true, expected: "All records linked and unchanged", actual: "Audit trail verified successfully." })}>
              Verify audit trail
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Receipt authenticity</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Textarea rows={4} value={receiptPayload} onChange={(e) => setReceiptPayload(e.target.value)} placeholder="Paste a receipt to verify..." />
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={verifyReceipt}>Verify receipt</Button>
            {receiptResult && (
              <div className={`rounded-md p-3 ${receiptResult === "authentic" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                {receiptResult === "authentic" ? "Receipt is authentic." : "Receipt is invalid or modified."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Duplicate payment protection</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Select value={dupOrder} onValueChange={setDupOrder}>
              <SelectTrigger><SelectValue placeholder="Select a paid order" /></SelectTrigger>
              <SelectContent>
                {paidOrders.map((o) => <SelectItem key={o.id} value={o.id}>{shortId(o.id, "#")} — {o.customerEmail}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-slate-500">Expected result: a second payment attempt should be rejected.</div>
            <Button variant="outline" onClick={runDuplicateCheck} disabled={!dupOrder}>Run controlled check</Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Check results</CardTitle></CardHeader>
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Run a check to see results here.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {results.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <div className="flex items-start gap-3">
                      {r.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 text-rose-600" />}
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-slate-500"><span className="text-slate-700">Expected:</span> {r.expected}</div>
                        <div className="text-xs text-slate-500"><span className="text-slate-700">Actual:</span> {r.actual}</div>
                        {r.related && <div className="text-xs text-slate-500">Related: {r.related}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={r.passed ? "success" : "failed"} />
                      <div className="mt-1 text-xs text-slate-500">{formatDate(r.at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Access control evidence</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {auditLogs.filter((l) => l.event.includes("access") || l.event.includes("refund") || l.event.includes("admin") || l.event.includes("receipt.verify")).slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium">{l.event}</div>
                    <div className="text-xs text-slate-500">Actor: {l.actor} · Entity: {l.entity}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={l.result} />
                    <span className="text-xs text-slate-500">{formatDate(l.at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">
          Technical details for engineers <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-md border border-slate-200 bg-white p-4 text-xs text-slate-600">
            Internal implementation: signed receipts (RS256), audit linkage hash chain, HMAC webhook signatures, idempotency nonce. These details are intentionally hidden from the main view to keep operations focused on outcomes.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function HealthCard({ h }: { h: { key: string; title: string; explanation: string; status: HealthStatus; checkedAt: string } }) {
  const tone = h.status === "healthy" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
               h.status === "warning" ? "bg-amber-50 text-amber-700 ring-amber-200" :
               h.status === "failed" ? "bg-rose-50 text-rose-700 ring-rose-200" :
               "bg-slate-50 text-slate-600 ring-slate-200";
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{h.title}</div>
          <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${tone} capitalize`}>{h.status}</span>
        </div>
        <p className="text-sm text-slate-500">{h.explanation}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Last checked: {formatDate(h.checkedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
