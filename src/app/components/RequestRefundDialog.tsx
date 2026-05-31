import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatVND, shortId } from "../lib/format";
import { toast } from "sonner";
import { useApp } from "../lib/store";
import type { Order, Transaction } from "../lib/types";

const REASONS = [
  "Duplicate order",
  "Wrong item",
  "Changed my mind",
  "Payment issue",
  "Other",
];

export function RequestRefundDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: Order | null;
}) {
  const { transactions, refundRequests, submitRefundRequest } = useApp();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (open) {
      setReason(REASONS[0]);
      setDetails("");
    }
  }, [open]);

  if (!order) return null;
  const txn: Transaction | undefined = order.transactionId
    ? transactions.find((t) => t.id === order.transactionId)
    : undefined;
  const existing = refundRequests.find(
    (r) => r.orderId === order.id && r.status === "pending_review",
  );

  const submit = () => {
    if (existing) {
      toast.error("A refund request for this order is already under review.");
      return;
    }
    try {
      submitRefundRequest({ orderId: order.id, reason, details: details.trim() || undefined });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refund request API is not connected yet.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request refund</DialogTitle>
          <DialogDescription>
            Submitting this request does not immediately refund the payment. It will be reviewed by
            our operations team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <Row label="Order" value={<span className="font-mono">{shortId(order.id, "#")}</span>} />
          <Row label="Order amount" value={formatVND(order.amount)} />
          <Row
            label="Payment provider"
            value={txn ? <StatusBadge status={txn.provider} /> : <span className="text-slate-400">—</span>}
          />
          <Row label="Payment date" value={txn ? formatDate(txn.createdAt) : "—"} />
          <Row
            label="Receipt"
            value={txn?.receiptId ? <span className="text-emerald-700">Available</span> : <span className="text-slate-500">Not available</span>}
          />
        </div>

        {existing && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            A refund request for this order is already under review.
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Refund reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Additional details</label>
            <Textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us more so we can review faster..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={!!existing} onClick={submit}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
