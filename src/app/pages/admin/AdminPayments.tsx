import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, shortId } from "../../lib/format";
import { RefreshCw, CheckCircle2 } from "lucide-react";

interface SyncResult { orderId: string; before: string; after: string; duplicatePrevented: boolean; at: string; }

export default function AdminPayments() {
  const { transactions, syncPayment, orders } = useApp();
  const [result, setResult] = useState<SyncResult | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-slate-500">Monitor local payment state versus provider state.</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment reference</TableHead><TableHead>Order</TableHead><TableHead>Provider</TableHead>
                <TableHead>Provider status</TableHead><TableHead>Local order status</TableHead>
                <TableHead>Last synced</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => {
                const order = orders.find((o) => o.id === t.orderId);
                return (
                  <TableRow key={t.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-sm">{t.providerReference}</TableCell>
                    <TableCell className="font-mono text-sm">{shortId(t.orderId, "#")}</TableCell>
                    <TableCell><StatusBadge status={t.provider} /></TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>{order && <StatusBadge status={order.status} />}</TableCell>
                    <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => {
                        const r = syncPayment(t.orderId);
                        setResult({ orderId: t.orderId, before: r.before, after: r.after, duplicatePrevented: r.duplicatePrevented, at: new Date().toISOString() });
                      }}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Sync</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base text-emerald-900">Sync result</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <Row k="Order" v={shortId(result.orderId, "#")} mono />
            <Row k="Local status before" v={<StatusBadge status={result.before} />} />
            <Row k="Local status after" v={<StatusBadge status={result.after} />} />
            <Row k="Transaction" v="Reused existing transaction" />
            <Row k="Duplicate creation prevented" v={result.duplicatePrevented ? "Yes" : "No"} />
            <Row k="Synced at" v={formatDate(result.at)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white p-2 ring-1 ring-emerald-100">
      <span className="text-slate-500">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}
