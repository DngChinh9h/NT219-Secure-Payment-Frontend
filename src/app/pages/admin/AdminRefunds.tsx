import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export default function AdminRefunds() {
  const { transactions, requestRefund } = useApp();
  const eligible = useMemo(() => transactions.filter((t) => t.status === "succeeded" && t.refundStatus === "none"), [transactions]);
  const refunds = transactions.filter((t) => t.refundStatus === "processed");
  const [selectedId, setSelectedId] = useState<string>("");
  const [reason, setReason] = useState("");

  const submit = () => {
    if (!selectedId) { toast.error("Select an eligible transaction"); return; }
    if (!reason.trim()) { toast.error("Reason required"); return; }
    requestRefund(selectedId, reason);
    toast.success("Refund processed");
    setSelectedId(""); setReason("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
        <p className="text-sm text-slate-500">Manage valid refunds. Refunds are restricted to eligible transactions.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Process a refund</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Select eligible transaction" /></SelectTrigger>
              <SelectContent>
                {eligible.length === 0 && <div className="px-2 py-2 text-sm text-slate-500">No eligible transactions</div>}
                {eligible.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {shortId(t.id, "#")} — {formatVND(t.amount)} — {t.customerEmail}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Reason for refund" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={submit}>Confirm refund</Button>
            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
              Admin can request a valid refund, but cannot directly edit transaction amount or force provider result.
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Refund history</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refund</TableHead><TableHead>Transaction</TableHead><TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead><TableHead>Reason</TableHead>
                  <TableHead>Refunded at</TableHead><TableHead>Provider</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{shortId(t.id, "rfd_")}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(t.id, "#")}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(t.orderId, "#")}</TableCell>
                    <TableCell className="text-sm font-medium">{formatVND(t.amount)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{t.refundReason ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t.refundedAt ? formatDate(t.refundedAt) : "—"}</TableCell>
                    <TableCell><StatusBadge status={t.provider} /></TableCell>
                  </TableRow>
                ))}
                {refunds.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">No refunds yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
