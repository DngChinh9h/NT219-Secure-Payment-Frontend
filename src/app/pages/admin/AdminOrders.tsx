import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "../../lib/types";

export default function AdminOrders() {
  const { orders, syncPayment, transactions } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => orders.filter((o) =>
    (status === "all" || o.status === status) &&
    (q === "" || o.id.includes(q) || o.customerEmail.includes(q) || o.customerName.toLowerCase().includes(q.toLowerCase())),
  ), [orders, q, status]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-slate-500">Investigate orders and sync payment state with providers.</p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search by order ID, customer..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead><TableHead>Provider</TableHead><TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-sm">{shortId(o.id, "#")}</TableCell>
                    <TableCell><div className="font-medium">{o.customerName}</div><div className="text-xs text-slate-500">{o.customerEmail}</div></TableCell>
                    <TableCell className="text-sm font-medium">{formatVND(o.amount)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell>{o.provider ? <StatusBadge status={o.provider} /> : <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell className="text-sm">{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="text-sm">{formatDate(o.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(o)}>View</Button>
                      <Button variant="ghost" size="sm" onClick={() => { const r = syncPayment(o.id); toast.success(`Synced ${shortId(o.id, "#")}: ${r.before} → ${r.after}`); }}>
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />Sync
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[520px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle className="font-mono">{shortId(selected.id, "#")}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Customer</div>
                  <div className="font-medium">{selected.customerName}</div>
                  <div className="text-xs text-slate-500">{selected.customerEmail}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Items</div>
                  <div className="space-y-1">
                    {selected.items.map((i) => (
                      <div key={i.productId} className="flex justify-between rounded-md border border-slate-100 p-2">
                        <div className="font-medium">{i.name} <span className="text-xs text-slate-500">× {i.quantity}</span></div>
                        <div>{formatVND(i.unitPrice * i.quantity)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Shipping</div>
                  <div>{selected.shippingAddress}</div>
                </div>
                {selected.transactionId && (
                  <div className="rounded-md border border-slate-200 p-3">
                    <div className="text-xs uppercase tracking-wider text-slate-500">Linked transaction</div>
                    <div className="font-mono">{shortId(selected.transactionId, "#")}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Receipt: {transactions.find((t) => t.id === selected.transactionId)?.receiptId ? "Issued" : "—"}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-slate-500">Total</span>
                  <span className="text-base font-semibold text-indigo-700">{formatVND(selected.amount)}</span>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
