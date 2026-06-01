import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { StatusBadge } from "../../components/StatusBadge";
import { RequestRefundDialog } from "../../components/RequestRefundDialog";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { Order } from "../../lib/types";

const FILTERS = [
  { v: "all", label: "All" },
  { v: "awaiting_payment", label: "Awaiting Payment" },
  { v: "processing", label: "Processing" },
  { v: "paid", label: "Paid" },
  { v: "failed", label: "Payment Failed" },
  { v: "refunded", label: "Refunded" },
];

type Verification = "authentic" | "invalid" | "unknown" | null;

export default function MyOrders() {
  const { orders, transactions, receipts, refundRequests, refundRequestsLoading, verifyReceiptForTransaction, dataLoading, apiError } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("summary");
  const [verifyResult, setVerifyResult] = useState<Verification>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);

  const myOrders = useMemo(
    () => orders,
    [orders],
  );
  const filtered = filter === "all" ? myOrders : myOrders.filter((o) => o.status === filter);
  const selected = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const txn = selected?.transactionId ? transactions.find((t) => t.id === selected.transactionId) : undefined;
  const receipt = txn?.receiptId ? receipts.find((r) => r.id === txn.receiptId) : undefined;
  const selectedRefundReq = selected
    ? refundRequests.find((r) => r.orderId === selected.id && r.status !== "cancelled" && r.status !== "rejected")
      ?? refundRequests.find((r) => r.orderId === selected.id)
    : undefined;

  const openOrder = (o: Order) => {
    setSelectedId(o.id);
    setTab("summary");
    setVerifyResult(null);
  };

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
              {filtered.map((o) => {
                const oTxn = o.transactionId ? transactions.find((t) => t.id === o.transactionId) : undefined;
                const oRcpt = oTxn?.receiptId ? receipts.find((r) => r.id === oTxn.receiptId) : undefined;
                return (
                  <TableRow key={o.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-sm">{shortId(o.id, "#")}</TableCell>
                    <TableCell className="text-sm">{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatVND(o.amount)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-sm">{o.provider ? <StatusBadge status={o.provider} /> : <span className="text-slate-400">—</span>}</TableCell>
                    <TableCell className="text-sm">{formatDate(o.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openOrder(o)}>View</Button>
                      {o.status === "awaiting_payment" && (
                        <Button size="sm" className="ml-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/checkout/${o.id}`)}>Pay now</Button>
                      )}
                      {o.status === "failed" && (
                        <Button size="sm" className="ml-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/checkout/${o.id}`)}>Retry payment</Button>
                      )}
                      {oRcpt && (
                        <Button variant="outline" size="sm" className="ml-2" onClick={() => { openOrder(o); setTab("receipt"); }}>View receipt</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">{dataLoading ? "Loading orders..." : apiError ?? "No orders in this view."}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-[540px] sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-mono">{shortId(selected.id, "#")}</SheetTitle>
                <SheetDescription>Order details, payment, receipt, and refund.</SheetDescription>
                <div className="flex items-center justify-between pt-1">
                  <StatusBadge status={selected.status} />
                  <div className="text-xs text-slate-500">{formatDate(selected.createdAt)}</div>
                </div>
              </SheetHeader>

              <Tabs value={tab} onValueChange={setTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="receipt">Receipt</TabsTrigger>
                  <TabsTrigger value="refund">Refund</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 text-sm">
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Items</div>
                    <div className="space-y-2">
                      {selected.items.map((i) => (
                        <div key={i.productId} className="flex justify-between rounded-md border border-slate-100 p-2">
                          <div>
                            <div className="font-medium">{i.name}</div>
                            <div className="text-xs text-slate-500">Qty {i.quantity} · {formatVND(i.unitPrice)}</div>
                          </div>
                          <div>{formatVND(i.unitPrice * i.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Shipping address</div>
                    <div className="text-slate-700">{selected.shippingAddress}</div>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold">
                    <span>Total</span><span className="text-indigo-700">{formatVND(selected.amount)}</span>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-3 text-sm">
                  {selected.status === "processing" && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800">
                      Payment confirmation is in progress.
                    </div>
                  )}
                  {selected.status === "failed" && (
                    <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800">
                      <div className="font-medium">Payment failed</div>
                      <div>Your payment was not completed. You have not been charged.</div>
                      <Button size="sm" className="mt-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/checkout/${selected.id}`)}>Retry payment</Button>
                    </div>
                  )}
                  {!txn ? (
                    selected.status === "awaiting_payment" ? (
                      <div className="flex items-center justify-between rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-500">
                        <span>No payment yet.</span>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/checkout/${selected.id}`)}>Pay now</Button>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-500">
                        No payment recorded for this order yet.
                      </div>
                    )
                  ) : (
                    <div className="space-y-2 rounded-md border border-slate-200 p-4">
                      <Row label="Transaction ID" value={<span className="font-mono">{shortId(txn.id, "#")}</span>} />
                      <Row label="Payment provider" value={<StatusBadge status={txn.provider} />} />
                      <Row label="Payment amount" value={formatVND(txn.amount)} />
                      <Row label="Payment status" value={<StatusBadge status={txn.status} />} />
                      <Row label="Provider reference" value={<span className="font-mono text-xs">{txn.providerReference}</span>} />
                      <Row label="Created" value={formatDate(txn.createdAt)} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="receipt" className="space-y-3 text-sm">
                  {!receipt ? (
                    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-500">
                      Receipt is not available yet.
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-md border border-slate-200 p-4">
                      <Row label="Status" value={<span className="font-medium text-emerald-700">Available</span>} />
                      <Row label="Issued" value={formatDate(receipt.issuedAt)} />
                      <Row label="Amount" value={`${formatVND(receipt.amount)} ${receipt.currency}`} />
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {
                            verifyReceiptForTransaction(txn!.id)
                              .then((result) => {
                                setVerifyResult(result.valid ? "authentic" : "invalid");
                                result.valid ? toast.success("Receipt verified as authentic") : toast.error("Receipt is invalid or modified");
                              })
                              .catch(() => {
                                setVerifyResult("unknown");
                                toast.error("Unable to verify receipt");
                              });
                          }}>
                          Verify receipt
                        </Button>
                      </div>
                      {verifyResult && (
                        <div className="flex items-center gap-2 rounded-md bg-slate-50 p-2 text-sm">
                          {verifyResult === "authentic" && <><ShieldCheck className="h-4 w-4 text-emerald-600" /> Authentic</>}
                          {verifyResult === "invalid" && <><ShieldAlert className="h-4 w-4 text-rose-600" /> Invalid or modified</>}
                          {verifyResult === "unknown" && <><ShieldQuestion className="h-4 w-4 text-amber-600" /> Unable to verify</>}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="refund" className="space-y-3 text-sm">
                  {selected.status === "refunded" ? (
                    <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <Row label="Refund status" value={<StatusBadge status="refunded" />} />
                      <Row label="Refund ID" value={<span className="font-mono">{selectedRefundReq?.refundTxnRef ?? (txn ? shortId(txn.id, "rf_") : "—")}</span>} />
                      <Row label="Refunded at" value={(selectedRefundReq?.refundedAt ?? txn?.refundedAt) ? formatDate((selectedRefundReq?.refundedAt ?? txn!.refundedAt)!) : "—"} />
                      <Row label="Refund reason" value={selectedRefundReq?.reason ?? txn?.refundReason ?? "—"} />
                    </div>
                  ) : refundRequestsLoading ? (
                    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-500">
                      Loading refund eligibility...
                    </div>
                  ) : selectedRefundReq && (selectedRefundReq.status === "pending_review" || selectedRefundReq.status === "approved_processing" || selectedRefundReq.status === "provider_pending" || selectedRefundReq.status === "succeeded") ? (
                    <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <Row label="Refund request status" value={<StatusBadge status={selectedRefundReq.status} />} />
                      <Row label="Submitted at" value={formatDate(selectedRefundReq.submittedAt)} />
                      <Button size="sm" variant="outline" onClick={() => navigate("/refund-requests")}>View request</Button>
                    </div>
                  ) : selected.status === "paid" ? (
                    <div className="space-y-3 rounded-md border border-slate-200 p-4">
                      <Row label="Refund eligibility" value={<span className="font-medium text-emerald-700">Eligible</span>} />
                      <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setRefundOrder(selected)}>
                        Request refund
                      </Button>
                    </div>
                  ) : selected.status === "failed" ? (
                    <div className="space-y-1 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-700">
                      <div><span className="font-medium">Refund eligibility:</span> Not needed</div>
                      <div className="text-slate-500">The payment was not completed, so no refund is needed.</div>
                    </div>
                  ) : (
                    <div className="space-y-1 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-700">
                      <div><span className="font-medium">Refund eligibility:</span> Not available yet</div>
                      <div className="text-slate-500">Refund is available only after payment is completed.</div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <RequestRefundDialog
        open={!!refundOrder}
        onOpenChange={(o) => !o && setRefundOrder(null)}
        order={refundOrder}
      />
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
