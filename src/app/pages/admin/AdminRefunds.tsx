import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { toast } from "sonner";
import type { RefundRequest } from "../../lib/types";

const FILTERS = [
  { v: "all", label: "All" },
  { v: "pending_review", label: "Pending review" },
  { v: "approved_processing", label: "Approved · processing" },
  { v: "rejected", label: "Rejected" },
  { v: "provider_failed", label: "Provider failed" },
  { v: "refunded", label: "Completed" },
];

export default function AdminRefunds() {
  const { refundRequests, orders, transactions, approveRefundRequest, rejectRefundRequest } = useApp();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<RefundRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RefundRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return refundRequests;
    return refundRequests.filter((r) => r.status === filter);
  }, [refundRequests, filter]);

  const counts = useMemo(() => ({
    pending: refundRequests.filter((r) => r.status === "pending_review").length,
    processing: refundRequests.filter((r) => r.status === "approved_processing").length,
    completed: refundRequests.filter((r) => r.status === "refunded").length,
    rejected: refundRequests.filter((r) => r.status === "rejected").length,
  }), [refundRequests]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
          <p className="text-sm text-slate-500">Review customer refund requests. Approve or reject each request.</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>{FILTERS.map((f) => <TabsTrigger key={f.v} value={f.v}>{f.label}</TabsTrigger>)}</TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Pending review" value={counts.pending} tone="amber" />
        <Metric label="Approved · processing" value={counts.processing} tone="blue" />
        <Metric label="Completed" value={counts.completed} tone="emerald" />
        <Metric label="Rejected" value={counts.rejected} tone="rose" />
      </div>

      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Refund requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-xs">{shortId(r.id, "#")}</TableCell>
                  <TableCell className="font-mono text-xs">{shortId(r.orderId, "#")}</TableCell>
                  <TableCell className="text-sm">{r.customerEmail}</TableCell>
                  <TableCell className="text-sm font-medium">{formatVND(r.amount)}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">{r.reason}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-sm">{formatDate(r.submittedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>View</Button>
                    {r.status === "pending_review" && (
                      <>
                        <Button size="sm" className="ml-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => setApproveTarget(r)}>Approve</Button>
                        <Button size="sm" variant="outline" className="ml-1 text-rose-600 hover:text-rose-700"
                          onClick={() => { setRejectTarget(r); setRejectReason(""); setInternalNote(""); }}>Reject</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">No refund requests in this view.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (() => {
            const order = orders.find((o) => o.id === selected.orderId);
            const txn = order?.transactionId ? transactions.find((t) => t.id === order.transactionId) : undefined;
            return (
              <Dialog open onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-mono">{shortId(selected.id, "#")}</DialogTitle>
                  <DialogDescription>Refund request details</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 rounded-md border border-slate-200 p-3 text-sm">
                  <Row label="Order" value={<span className="font-mono">{shortId(selected.orderId, "#")}</span>} />
                  <Row label="Customer" value={selected.customerEmail} />
                  <Row label="Amount" value={formatVND(selected.amount)} />
                  <Row label="Reason" value={selected.reason} />
                  {selected.details && <Row label="Details" value={selected.details} />}
                  <Row label="Status" value={<StatusBadge status={selected.status} />} />
                  <Row label="Submitted" value={formatDate(selected.submittedAt)} />
                  {selected.reviewedAt && <Row label="Reviewed at" value={formatDate(selected.reviewedAt)} />}
                  {selected.reviewedBy && <Row label="Reviewed by" value={selected.reviewedBy} />}
                  {selected.rejectionReason && <Row label="Rejection reason" value={selected.rejectionReason} />}
                  {selected.internalNote && <Row label="Internal note" value={selected.internalNote} />}
                </div>
                {txn && (
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Transaction</div>
                    <Row label="Transaction" value={<span className="font-mono">{shortId(txn.id, "#")}</span>} />
                    <Row label="Provider" value={<StatusBadge status={txn.provider} />} />
                    <Row label="Reference" value={<span className="font-mono text-xs">{txn.providerReference}</span>} />
                  </div>
                )}
                <DialogFooter>
                  {selected.status === "pending_review" ? (
                    <>
                      <Button variant="outline" className="text-rose-600 hover:text-rose-700"
                        onClick={() => { setRejectTarget(selected); setRejectReason(""); setInternalNote(""); setSelected(null); }}>
                        Reject
                      </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => { setApproveTarget(selected); setSelected(null); }}>
                        Approve
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setSelected(null)}>Close</Button>
                  )}
                </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          })()}

      {approveTarget && (
        <Dialog open onOpenChange={(o) => !o && setApproveTarget(null)}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve refund request</DialogTitle>
                <DialogDescription>The refund will be sent to the payment provider for processing.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 rounded-md border border-slate-200 p-3 text-sm">
                <Row label="Order" value={<span className="font-mono">{shortId(approveTarget.orderId, "#")}</span>} />
                <Row label="Customer" value={approveTarget.customerEmail} />
                <Row label="Amount" value={formatVND(approveTarget.amount)} />
                <Row label="Reason" value={approveTarget.reason} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    approveRefundRequest(approveTarget.id);
                    toast.success("Refund approved. Processing with provider.");
                    setApproveTarget(null);
                  }}>
                  Confirm approval
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {rejectTarget && (
        <Dialog open onOpenChange={(o) => !o && setRejectTarget(null)}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject refund request</DialogTitle>
                <DialogDescription>The customer will see the rejection reason.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Rejection reason (required)</label>
                  <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this request is being rejected..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Internal note (optional)</label>
                  <Textarea rows={2} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Visible to operations only" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                <Button className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => {
                    if (!rejectReason.trim()) { toast.error("Rejection reason is required."); return; }
                    rejectRefundRequest(rejectTarget.id, rejectReason.trim(), internalNote.trim() || undefined);
                    toast.success("Refund request rejected.");
                    setRejectTarget(null);
                  }}>
                  Confirm rejection
                </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "blue" | "emerald" | "rose" }) {
  const map: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <Card className={`border ${map[tone]}`}>
      <CardContent className="p-4">
        <div className="text-xs">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
