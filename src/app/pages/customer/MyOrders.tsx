import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { useNavigate } from "react-router";
import { CheckCircle2, Circle } from "lucide-react";
import type { Order } from "../../lib/types";

const FILTERS = [
  { v: "all", label: "All" },
  { v: "awaiting_payment", label: "Pending" },
  { v: "processing", label: "Processing" },
  { v: "paid", label: "Paid" },
  { v: "failed", label: "Failed" },
  { v: "refunded", label: "Refunded" },
];

export default function MyOrders() {
  const { orders, user, transactions } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const myOrders = useMemo(
    () => orders.filter((o) => !user || o.customerEmail === user.email || true),
    [orders, user],
  );
  const filtered = filter === "all" ? myOrders : myOrders.filter((o) => o.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
          <p className="text-sm text-slate-500">Track order status, payments, and receipts.</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>{FILTERS.map((f) => <TabsTrigger key={f.v} value={f.v}>{f.label}</TabsTrigger>)}</TabsList>
        </Tabs>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{shortId(o.id, "#")}</TableCell>
                  <TableCell className="text-sm">{formatDate(o.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatVND(o.amount)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-sm">{o.provider ? <StatusBadge status={o.provider} /> : <span className="text-slate-400">—</span>}</TableCell>
                  <TableCell className="text-sm">{formatDate(o.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(o)}>View</Button>
                    {o.status === "awaiting_payment" && (
                      <Button size="sm" className="ml-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/checkout/${o.id}`)}>Pay now</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">No orders in this view.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[480px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-mono">{shortId(selected.id, "#")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="flex items-center justify-between">
                  <StatusBadge status={selected.status} />
                  <div className="text-slate-500">{formatDate(selected.createdAt)}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Items</div>
                  <div className="space-y-2">
                    {selected.items.map((i) => (
                      <div key={i.productId} className="flex justify-between rounded-md border border-slate-100 p-2">
                        <div><div className="font-medium">{i.name}</div><div className="text-xs text-slate-500">Qty {i.quantity}</div></div>
                        <div>{formatVND(i.unitPrice * i.quantity)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Shipping</div>
                  <div className="text-slate-700">{selected.shippingAddress}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Payment timeline</div>
                  <ol className="relative space-y-3 border-l border-slate-200 pl-5">
                    {selected.timeline.map((t, idx) => (
                      <li key={idx} className="relative">
                        <span className="absolute -left-[26px] top-0.5 grid h-4 w-4 place-items-center">
                          {t.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
                        </span>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-slate-500">{t.at ? formatDate(t.at) : "—"}</div>
                      </li>
                    ))}
                  </ol>
                </div>
                {selected.transactionId && (
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Linked transaction</div>
                    <div className="mt-0.5 font-mono">{shortId(selected.transactionId, "#")}</div>
                    {transactions.find((t) => t.id === selected.transactionId)?.receiptId && (
                      <div className="mt-2 text-xs">
                        Receipt:{" "}
                        <span className="font-medium text-emerald-700">Issued</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold">
                  <span>Total</span><span className="text-indigo-700">{formatVND(selected.amount)}</span>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
