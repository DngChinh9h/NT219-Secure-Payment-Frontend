import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useApp } from "../../lib/store";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { StatusBadge } from "../../components/StatusBadge";
import { formatVND, shortId } from "../../lib/format";
import { CreditCard, Landmark, Lock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Order, Transaction } from "../../lib/types";

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, setOrderProvider, simulatePayment } = useApp();
  const order = orders.find((o) => o.id === orderId);
  const [method, setMethod] = useState<"stripe" | "sandbox_bank">("stripe");
  const [sandboxChoice, setSandboxChoice] = useState<"approve" | "decline" | "pending">("approve");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ order: Order; transaction: Transaction } | null>(null);

  if (!order) {
    return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Order not found.</div>;
  }

  const pay = async () => {
    setBusy(true);
    setOrderProvider(order.id, method);
    await new Promise((r) => setTimeout(r, 800));
    const choice = method === "stripe" ? "approve" : sandboxChoice;
    const r = simulatePayment(order.id, choice);
    setResult({ order: r.order, transaction: r.transaction });
    setBusy(false);
    if (r.transaction.status === "succeeded") toast.success("Payment completed");
    else if (r.transaction.status === "failed") toast.error("Payment failed");
    else toast.message("Payment is being processed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="text-sm text-slate-500">Complete your secure payment to confirm the order.</p>
        </div>
        <StatusBadge status={(result?.order ?? order).status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Payment method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as "stripe" | "sandbox_bank")} className="grid gap-3 sm:grid-cols-2">
                <Label htmlFor="m-stripe"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "stripe" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>
                  <RadioGroupItem id="m-stripe" value="stripe" className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-indigo-600" />Card payment</div>
                    <div className="text-xs text-slate-500">Visa, Mastercard, JCB</div>
                  </div>
                </Label>
                <Label htmlFor="m-sandbox"
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "sandbox_bank" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>
                  <RadioGroupItem id="m-sandbox" value="sandbox_bank" className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4 text-indigo-600" />Sandbox Bank</div>
                    <div className="text-xs text-slate-500">For testing — controlled result</div>
                  </div>
                </Label>
              </RadioGroup>

              {method === "stripe" && (
                <div className="mt-5 space-y-3">
                  <div className="text-sm font-medium">Secure card input</div>
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" /> Card field provided by the payment provider</div>
                    <div className="mt-3 grid gap-2">
                      <div className="h-10 animate-pulse rounded-md bg-white ring-1 ring-slate-200" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-10 animate-pulse rounded-md bg-white ring-1 ring-slate-200" />
                        <div className="h-10 animate-pulse rounded-md bg-white ring-1 ring-slate-200" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Card details are handled by the payment provider.</div>
                  </div>
                </div>
              )}

              {method === "sandbox_bank" && (
                <div className="mt-5 space-y-3">
                  <div className="text-sm font-medium">Sandbox Bank — controlled result</div>
                  <RadioGroup value={sandboxChoice} onValueChange={(v) => setSandboxChoice(v as "approve" | "decline" | "pending")} className="grid gap-2 sm:grid-cols-3">
                    {[
                      { v: "approve", label: "Approve payment" },
                      { v: "decline", label: "Decline payment" },
                      { v: "pending", label: "Keep pending" },
                    ].map((o) => (
                      <Label key={o.v} htmlFor={`s-${o.v}`}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm ${sandboxChoice === o.v ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
                        <RadioGroupItem id={`s-${o.v}`} value={o.v} />{o.label}
                      </Label>
                    ))}
                  </RadioGroup>
                  <div className="text-xs text-slate-500">This provider is for sandbox/testing mode only.</div>
                </div>
              )}

              <Button disabled={busy || !!result} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700" onClick={pay}>
                {busy ? "Processing..." : `Pay ${formatVND(order.amount)} securely`}
              </Button>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Backend confirms payment status with the provider.
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Payment result</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-start gap-3 rounded-lg border p-4 ${
                  result.transaction.status === "succeeded" ? "border-emerald-200 bg-emerald-50" :
                  result.transaction.status === "failed" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                }`}>
                  {result.transaction.status === "succeeded" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />}
                  <div className="text-sm">
                    <div className="font-medium">
                      {result.transaction.status === "succeeded" ? "Payment completed" :
                       result.transaction.status === "failed" ? "Payment failed" : "Payment is processing"}
                    </div>
                    <div className="text-slate-600">
                      Provider reference: <span className="font-mono">{result.transaction.providerReference}</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" onClick={() => navigate(`/orders`)}>View my orders</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/receipts`)}>View receipts</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit border-slate-200">
          <CardHeader><CardTitle className="text-base">Order summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-500"><span>Order ID</span><span className="font-mono text-slate-900">{shortId(order.id, "#")}</span></div>
            <div className="space-y-2 border-y border-slate-100 py-3">
              {order.items.map((i) => (
                <div key={i.productId} className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{i.name}</div>
                    <div className="text-xs text-slate-500">Qty {i.quantity}</div>
                  </div>
                  <div>{formatVND(i.unitPrice * i.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="text-slate-500"><div className="font-medium text-slate-900">Shipping to</div>{order.shippingAddress}</div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-indigo-700">{formatVND(order.amount)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
