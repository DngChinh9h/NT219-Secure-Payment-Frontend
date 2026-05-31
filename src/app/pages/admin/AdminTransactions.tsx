import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import type { Transaction } from "../../lib/types";

export default function AdminTransactions() {
  const { transactions, requestRefund } = useApp();
  const [refundOf, setRefundOf] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-slate-500">Inspect payment transactions and process eligible refunds.</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead><TableHead>Order</TableHead><TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
                <TableHead>Refund</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{shortId(t.id, "#")}</TableCell>
                  <TableCell className="font-mono text-sm">{shortId(t.orderId, "#")}</TableCell>
                  <TableCell className="text-sm">{t.customerEmail}</TableCell>
                  <TableCell><StatusBadge status={t.provider} /></TableCell>
                  <TableCell className="text-sm font-medium">{formatVND(t.amount)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell><StatusBadge status={t.refundStatus} /></TableCell>
                  <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {t.status === "succeeded" && t.refundStatus === "none" ? (
                      <Button size="sm" variant="outline" onClick={() => setRefundOf(t)}>Process refund</Button>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!refundOf} onOpenChange={(o) => !o && setRefundOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process refund</DialogTitle>
            <DialogDescription>This will refund the customer and update the transaction and order status.</DialogDescription>
          </DialogHeader>
          {refundOf && (
            <div className="space-y-3">
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Transaction</span><span className="font-mono">{shortId(refundOf.id, "#")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span>{formatVND(refundOf.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Provider</span><StatusBadge status={refundOf.provider} /></div>
              </div>
              <Textarea placeholder="Reason for refund" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOf(null)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
              if (!refundOf) return;
              if (!reason.trim()) { toast.error("Reason required"); return; }
              requestRefund(refundOf.id, reason); toast.success("Refund processed");
              setRefundOf(null); setReason("");
            }}>Confirm refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
