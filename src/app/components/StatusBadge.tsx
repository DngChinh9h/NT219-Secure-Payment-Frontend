import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

const TONE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  succeeded: "bg-emerald-100 text-emerald-700 border-emerald-200",
  healthy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  awaiting_payment: "bg-amber-100 text-amber-700 border-amber-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  received: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  denied: "bg-rose-100 text-rose-700 border-rose-200",
  error: "bg-rose-100 text-rose-700 border-rose-200",
  invalid: "bg-rose-100 text-rose-700 border-rose-200",
  broken: "bg-rose-100 text-rose-700 border-rose-200",
  refunded: "bg-violet-100 text-violet-700 border-violet-200",
  duplicate: "bg-violet-100 text-violet-700 border-violet-200",
  pending_review: "bg-amber-100 text-amber-700 border-amber-200",
  approved_processing: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  provider_failed: "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  payment_failed: "bg-rose-100 text-rose-700 border-rose-200",
  created: "bg-slate-100 text-slate-700 border-slate-200",
  issued: "bg-slate-100 text-slate-700 border-slate-200",
  none: "bg-slate-100 text-slate-600 border-slate-200",
  unchecked: "bg-slate-100 text-slate-600 border-slate-200",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const LABEL: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  mock_bank: "Sandbox Bank",
  stripe: "Stripe",
  none: "No refund",
  failed: "Payment failed",
  payment_failed: "Payment failed",
  pending_review: "Pending review",
  approved_processing: "Approved · processing",
  provider_failed: "Provider failed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export function StatusBadge({ status, className, children }: { status: string; className?: string; children?: React.ReactNode }) {
  const tone = TONE[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const label = LABEL[status] ?? status.replace(/_/g, " ");
  return (
    <Badge variant="outline" className={cn("capitalize border", tone, className)}>
      {children ?? label}
    </Badge>
  );
}
