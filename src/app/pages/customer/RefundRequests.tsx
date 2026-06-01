import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { RequestRefundDialog } from "../../components/RequestRefundDialog";
import { toast } from "sonner";
import type { Order, RefundRequest } from "../../lib/types";
import { Inbox, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";

export default function RefundRequests() {
  const {
    orders,
    transactions,
    refundRequests,
    cancelRefundRequest,
    dataLoading,
    refundRequestsLoading,
    refundRequestsError,
  } = useApp();
  const [requestOrder, setRequestOrder] = useState<Order | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const eligible = useMemo(() => {
    return orders.filter((o) => {
      if (o.status !== "paid") return false;
      const hasPending = refundRequests.some(
        (r) => r.orderId === o.id
          && (r.status === "pending_review" || r.status === "approved_processing" || r.status === "provider_pending" || r.status === "succeeded"),
      );
      return !hasPending;
    });
  }, [orders, refundRequests]);

  const mine = refundRequests;
  const selected = selectedId ? refundRequests.find((request) => request.id === selectedId) ?? null : null;

  const cancel = async (id: string, closeSheet = false) => {
    setCancellingId(id);
    try {
      await cancelRefundRequest(id);
      toast.success("Refund request cancelled.");
      if (closeSheet) setSelectedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel refund request.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Refund Requests</h1>
        <p className="text-sm text-slate-500">Request and track refunds for eligible paid orders.</p>
      </div>
      {refundRequestsError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Unable to load refund requests: {refundRequestsError}
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Eligible for refund</CardTitle>
          <span className="text-xs text-slate-500">{eligible.length} order(s)</span>
        </CardHeader>
        <CardContent className="p-0">
          {dataLoading || refundRequestsLoading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">Loading eligible orders...</div>
          ) : eligible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-slate-500">
              <Inbox className="h-6 w-6 text-slate-400" />
              No orders are currently eligible for refund.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Order date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligible.map((o) => {
                  const t = o.transactionId ? transactions.find((x) => x.id === o.transactionId) : undefined;
                  return (
                    <TableRow key={o.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-sm">{shortId(o.id, "#")}</TableCell>
                      <TableCell className="text-sm">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-sm font-medium">{formatVND(o.amount)}</TableCell>
                      <TableCell>{t ? <StatusBadge status={t.provider} /> : <span className="text-slate-400">—</span>}</TableCell>
                      <TableCell><StatusBadge status="paid" /></TableCell>
                      <TableCell className="text-sm">{t?.receiptId ? <span className="text-emerald-700">Available</span> : <span className="text-slate-500">—</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setRequestOrder(o)}>
                          Request refund
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">My refund requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {refundRequestsLoading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">Loading refund requests...</div>
          ) : mine.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              You haven't submitted any refund requests yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-xs">{shortId(r.id, "#")}</TableCell>
                    <TableCell className="font-mono text-xs">{shortId(r.orderId, "#")}</TableCell>
                    <TableCell className="text-sm font-medium">{formatVND(r.amount)}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{r.reason}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm">{formatDate(r.submittedAt)}</TableCell>
                    <TableCell className="text-sm">{formatDate(r.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedId(r.id)}>View</Button>
                      {r.status === "pending_review" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 text-rose-600 hover:text-rose-700"
                          disabled={cancellingId === r.id}
                          onClick={() => void cancel(r.id)}
                        >
                          {cancellingId === r.id ? "Cancelling..." : "Cancel"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {requestOrder && (
        <RequestRefundDialog
          open
          onOpenChange={(o) => !o && setRequestOrder(null)}
          order={requestOrder}
        />
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-[480px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{shortId(selected.id, "#")}</SheetTitle>
                <SheetDescription>Refund request details</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-3 text-sm">
                <StatusMessage status={selected.status} />
                <div className="space-y-2 rounded-md border border-slate-200 p-3">
                  <Row label="Order" value={<span className="font-mono">{shortId(selected.orderId, "#")}</span>} />
                  <Row label="Amount" value={formatVND(selected.amount)} />
                  {selected.provider && <Row label="Provider" value={<StatusBadge status={selected.provider} />} />}
                  <Row label="Reason" value={selected.reason} />
                  {selected.details && <Row label="Details" value={selected.details} />}
                  <Row label="Status" value={<StatusBadge status={selected.status} />} />
                  <Row label="Submitted" value={formatDate(selected.submittedAt)} />
                  <Row label="Last updated" value={formatDate(selected.updatedAt)} />
                </div>

                {selected.status === "succeeded" && (
                  <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <Row label="Provider refund ID" value={<span className="font-mono">{selected.refundTxnRef ?? "—"}</span>} />
                    <Row label="Refunded at" value={selected.refundedAt ? formatDate(selected.refundedAt) : "—"} />
                    <Row label="Amount refunded" value={formatVND(selected.amount)} />
                  </div>
                )}

                {selected.status === "rejected" && (
                  <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800">
                    <div className="font-medium">Rejection reason</div>
                    <div>{selected.rejectionReason ?? "—"}</div>
                    <Row label="Reviewed at" value={selected.reviewedAt ? formatDate(selected.reviewedAt) : "—"} />
                    {selected.reviewedBy && <Row label="Reviewed by" value={selected.reviewedBy} />}
                  </div>
                )}

                {selected.status === "provider_failed" && (
                  <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-800">
                    <div className="font-medium">The payment provider could not complete this refund.</div>
                    {selected.providerMessage && <div className="mt-1 text-xs">{selected.providerMessage}</div>}
                    <div className="mt-2 text-sm">Please contact support.</div>
                  </div>
                )}

                {selected.status === "pending_review" && (
                  <Button
                    variant="outline"
                    className="w-full text-rose-600 hover:text-rose-700"
                    disabled={cancellingId === selected.id}
                    onClick={() => void cancel(selected.id, true)}
                  >
                    {cancellingId === selected.id ? "Cancelling..." : "Cancel request"}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusMessage({ status }: { status: RefundRequest["status"] }) {
  if (status === "pending_review")
    return <Banner tone="amber" icon={<Clock className="h-4 w-4" />} text="Your refund request is waiting for review." />;
  if (status === "approved_processing")
    return <Banner tone="blue" icon={<Clock className="h-4 w-4" />} text="Your refund was approved and is being processed by the payment provider." />;
  if (status === "provider_pending")
    return <Banner tone="amber" icon={<Clock className="h-4 w-4" />} text="The payment provider is still processing your refund." />;
  if (status === "succeeded")
    return <Banner tone="emerald" icon={<CheckCircle2 className="h-4 w-4" />} text="Refund completed successfully." />;
  if (status === "rejected")
    return <Banner tone="rose" icon={<XCircle className="h-4 w-4" />} text="Your refund request was rejected." />;
  if (status === "provider_failed")
    return <Banner tone="orange" icon={<AlertTriangle className="h-4 w-4" />} text="The payment provider could not complete this refund." />;
  if (status === "cancelled")
    return <Banner tone="slate" icon={<XCircle className="h-4 w-4" />} text="This refund request was cancelled." />;
  return <Banner tone="slate" icon={<AlertTriangle className="h-4 w-4" />} text="This refund request has an unknown status." />;
}

function Banner({ tone, icon, text }: { tone: "amber" | "blue" | "emerald" | "rose" | "orange" | "slate"; icon: React.ReactNode; text: string }) {
  const map: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${map[tone]}`}>
      {icon}
      <span>{text}</span>
    </div>
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
