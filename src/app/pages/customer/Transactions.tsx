import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { toast } from "sonner";
import type { Transaction } from "../../lib/types";

export default function TransactionsPage() {
  const { transactions, requestRefund } = useApp();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [refundOf, setRefundOf] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");

  const submitRefund = () => {
    if (!refundOf) return;
    if (!reason.trim()) { toast.error("Please provide a refund reason"); return; }
    requestRefund(refundOf.id, reason);
    toast.success("Refund processed");
    setRefundOf(null); setReason("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-slate-500">A complete history of your payments and refunds.</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{shortId(t.id, "#")}</TableCell>
                  <TableCell className="font-mono text-sm">{shortId(t.orderId, "#")}</TableCell>
                  <TableCell><StatusBadge status={t.provider} /></TableCell>
                  <TableCell className="text-sm font-medium">{formatVND(t.amount)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                  <TableCell><StatusBadge status={t.refundStatus} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(t)}>View</Button>
                    {t.status === "succeeded" && t.refundStatus === "none" && (
                      <Button size="sm" variant="outline" className="ml-2" onClick={() => setRefundOf(t)}>Refund</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[460px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle className="font-mono">{shortId(selected.id, "#")}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center gap-2"><StatusBadge status={selected.status} /><StatusBadge status={selected.refundStatus} /></div>
                <Row k="Order" v={shortId(selected.orderId, "#")} mono />
                <Row k="Provider" v={<StatusBadge status={selected.provider} />} />
                <Row k="Provider reference" v={selected.providerReference} mono />
                <Row k="Amount" v={formatVND(selected.amount)} />
                <Row k="Created" v={formatDate(selected.createdAt)} />
                {selected.refundedAt && <Row k="Refunded at" v={formatDate(selected.refundedAt)} />}
                {selected.refundReason && <Row k="Refund reason" v={selected.refundReason} />}
                {selected.receiptId && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <div className="text-xs text-emerald-700">Receipt</div>
                    <div className="font-mono text-emerald-900">{shortId(selected.receiptId, "#")}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!refundOf} onOpenChange={(o) => !o && setRefundOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a refund</DialogTitle>
            <DialogDescription>
              Refunding this transaction will update the order and transaction status. Continue?
            </DialogDescription>
          </DialogHeader>
          {refundOf && (
            <div className="space-y-3">
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Transaction</span><span className="font-mono">{shortId(refundOf.id, "#")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span>{formatVND(refundOf.amount)}</span></div>
              </div>
              <Textarea placeholder="Refund reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOf(null)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submitRefund}>Confirm refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-500">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}
