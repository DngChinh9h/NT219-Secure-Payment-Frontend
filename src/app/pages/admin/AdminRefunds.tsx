import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { RefundRequest } from "../../lib/types";
import type { MockRefundOutcome } from "../../services";

type BusyAction = { id: string; action: "approve" | "reject" } | null;

export default function AdminRefunds() {
  const {
    refundRequests,
    refundRequestsLoading,
    refundRequestsError,
    publicConfig,
    refreshRefundRequests,
    approveRefundRequest,
    rejectRefundRequest,
  } = useApp();
  const [approveTarget, setApproveTarget] = useState<RefundRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RefundRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [mockRefundOutcome, setMockRefundOutcome] = useState<MockRefundOutcome>("success");
  const [busy, setBusy] = useState<BusyAction>(null);
  const providerFailures = refundRequests.filter((request) => request.status === "provider_failed");

  const approve = async (request: RefundRequest) => {
    const sandboxOutcome = request.provider === "mock_bank" && publicConfig.environment === "sandbox"
      ? mockRefundOutcome
      : undefined;
    setBusy({ id: request.id, action: "approve" });
    setApproveTarget(null);
    try {
      const refreshedRequest = await approveRefundRequest(request.id, sandboxOutcome);
      if (refreshedRequest.status === "succeeded") {
        toast.success("Provider confirmed refund.");
      } else if (refreshedRequest.status === "approved_processing" || refreshedRequest.status === "provider_pending") {
        toast.message("Provider is still processing the refund.");
      } else if (refreshedRequest.status === "provider_failed") {
        toast.warning("Provider could not complete the refund.");
      } else {
        toast.message(`Refund request status: ${refreshedRequest.status.replace(/_/g, " ")}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve refund request.");
    } finally {
      setApproveTarget(null);
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget || !adminNote.trim()) return;
    setBusy({ id: rejectTarget.id, action: "reject" });
    try {
      await rejectRefundRequest(rejectTarget.id, adminNote.trim());
      toast.success("Refund request rejected.");
      setRejectTarget(null);
      setAdminNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject refund request.");
    } finally {
      setBusy(null);
    }
  };

  const openRejectDialog = (request: RefundRequest) => {
    setAdminNote("");
    setRejectTarget(request);
  };

  const openApproveDialog = (request: RefundRequest) => {
    setMockRefundOutcome("success");
    setApproveTarget(request);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
          <p className="text-sm text-slate-500">Review customer refund requests and track provider outcomes.</p>
        </div>
        <Button variant="outline" disabled={refundRequestsLoading} onClick={() => void refreshRefundRequests()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {refundRequestsLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {refundRequestsError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Unable to load refund requests: {refundRequestsError}
        </div>
      )}

      {providerFailures.length > 0 && (
        <div className="space-y-1 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <div className="font-medium">Some refunds could not be completed by the payment provider.</div>
          {providerFailures.map((request) => (
            <div key={request.id}>
              {shortId(request.id, "#")}: {request.providerMessage ?? "Provider error details are not available."}
            </div>
          ))}
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Customer refund requests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {refundRequestsLoading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">Loading refund requests...</div>
          ) : refundRequests.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">No refund requests have been submitted.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Admin decision</TableHead>
                  <TableHead>Provider result</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead>Admin note</TableHead>
                  <TableHead>Provider refund ID / error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundRequests.map((request) => {
                  const isBusy = busy?.id === request.id;
                  return (
                    <TableRow key={request.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs">{shortId(request.id, "#")}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(request.orderId, "#")}</TableCell>
                      <TableCell className="text-sm">{request.customerEmail ?? request.customerId ?? "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{formatVND(request.amount)}</TableCell>
                      <TableCell>{request.provider ? <StatusBadge status={request.provider} /> : "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{request.reason}</TableCell>
                      <TableCell><AdminDecision request={request} /></TableCell>
                      <TableCell><ProviderResult request={request} /></TableCell>
                      <TableCell className="text-sm">{formatDate(request.submittedAt)}</TableCell>
                      <TableCell className="text-sm">{request.reviewedAt ? formatDate(request.reviewedAt) : "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{request.internalNote ?? "—"}</TableCell>
                      <TableCell className="max-w-[220px] text-xs">
                        {request.providerMessage ? (
                          <span className="text-orange-700">{request.providerMessage}</span>
                        ) : request.refundTxnRef ? (
                          <span className="font-mono">{request.refundTxnRef}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {request.status === "pending_review" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={isBusy && busy.action === "approve"}
                              onClick={() => openApproveDialog(request)}
                            >
                              {isBusy && busy.action === "approve" ? "Processing with provider..." : "Approve"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              disabled={isBusy && busy.action === "reject"}
                              onClick={() => openRejectDialog(request)}
                            >
                              {isBusy && busy.action === "reject" ? "Rejecting..." : "Reject"}
                            </Button>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve refund request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will ask the payment provider to process the refund. Admin approval does not directly move money.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {approveTarget?.provider === "mock_bank" && publicConfig.environment === "sandbox" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Sandbox provider outcome</label>
              <Select value={mockRefundOutcome} onValueChange={(value) => setMockRefundOutcome(value as MockRefundOutcome)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-slate-500">Available only for Sandbox Bank refund testing.</div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!approveTarget || busy?.action === "approve"}
              onClick={() => {
                if (approveTarget) void approve(approveTarget);
              }}
            >
              {busy?.action === "approve" ? "Processing with provider..." : "Approve refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject refund request</DialogTitle>
            <DialogDescription>Add an admin note explaining why this request is rejected.</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            placeholder="Admin note"
          />
          <DialogFooter>
            <Button variant="outline" disabled={busy?.action === "reject"} onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button disabled={!adminNote.trim() || busy?.action === "reject"} onClick={() => void reject()}>
              {busy?.action === "reject" ? "Rejecting..." : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminDecision({ request }: { request: RefundRequest }) {
  if (request.status === "pending_review") return <StatusBadge status="pending_review">Pending Review</StatusBadge>;
  if (request.status === "rejected") return <StatusBadge status="rejected" />;
  if (request.status === "cancelled") return <StatusBadge status="cancelled" />;
  if (request.status === "unknown") return <StatusBadge status="unknown" />;
  return <StatusBadge status="approved_processing">Approved</StatusBadge>;
}

function ProviderResult({ request }: { request: RefundRequest }) {
  if (request.status === "approved_processing") return <StatusBadge status="approved_processing">Processing</StatusBadge>;
  if (request.status === "provider_pending") return <StatusBadge status="provider_pending">Pending</StatusBadge>;
  if (request.status === "succeeded") return <StatusBadge status="succeeded">Succeeded</StatusBadge>;
  if (request.status === "provider_failed") return <StatusBadge status="provider_failed">Failed</StatusBadge>;
  return <span className="text-slate-400">—</span>;
}
