import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useApp } from "../../lib/store";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { StatusBadge } from "../../components/StatusBadge";
import { formatVND, shortId } from "../../lib/format";
import { CreditCard, Landmark, Lock, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import type { Order, Transaction } from "../../lib/types";
import { isSandbox } from "../../lib/config";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, setOrderProvider, simulatePayment } = useApp();
  const order = orders.find((o) => o.id === orderId);
  const [method, setMethod] = useState<"stripe" | "sandbox_bank">("stripe");
  const [sandboxChoice, setSandboxChoice] = useState<"approve" | "decline" | "pending">("approve");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ order: Order; transaction: Transaction } | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
  };

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="text-sm text-slate-500">Complete your secure payment to confirm the order.</p>
        </div>
        <div className="flex items-center gap-2">
          {isSandbox() && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              <FlaskConical className="mr-1 h-3 w-3" /> Sandbox environment
            </Badge>
          )}
          <StatusBadge status={(result?.order ?? order).status} />
        </div>
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
                {isSandbox() && (
                  <Label htmlFor="m-sandbox"
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "sandbox_bank" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>
                    <RadioGroupItem id="m-sandbox" value="sandbox_bank" className="mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4 text-indigo-600" />Sandbox Bank</div>
                      <div className="text-xs text-slate-500">Available in sandbox environment</div>
                    </div>
                  </Label>
                )}
              </RadioGroup>

              {method === "stripe" && (
                <div className="mt-5 space-y-3">
                  <div className="text-sm font-medium">Secure card input</div>
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" /> Card field provided by the payment provider</div>
                    <div className="mt-3 grid gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="card-number" className="text-xs text-slate-600">Card number</Label>
                        <Input id="card-number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
                          value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="card-name" className="text-xs text-slate-600">Cardholder name</Label>
                        <Input id="card-name" autoComplete="cc-name" placeholder="NGUYEN VAN A"
                          value={cardName} onChange={(e) => setCardName(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="card-expiry" className="text-xs text-slate-600">Expiry (MM/YY)</Label>
                          <Input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                            value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="card-cvc" className="text-xs text-slate-600">CVC</Label>
                          <Input id="card-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                            value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Card details are handled by the payment provider.</div>
                  </div>
                </div>
              )}

              {method === "sandbox_bank" && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4 text-indigo-600" />Pay with Sandbox Bank</div>
                    <div className="mt-1 text-xs text-slate-500">
                      You'll be redirected to the Sandbox Bank to confirm the payment. The bank will notify SecurePay once the payment is complete.
                    </div>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Developer · sandbox response</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/50 p-3">
                        <div className="mb-2 text-xs text-amber-900">
                          Choose how Sandbox Bank should respond. This panel is only visible to developers and is hidden in production.
                        </div>
                        <RadioGroup value={sandboxChoice} onValueChange={(v) => setSandboxChoice(v as "approve" | "decline" | "pending")} className="grid gap-2 sm:grid-cols-3">
                          {[
                            { v: "approve", label: "Approve" },
                            { v: "decline", label: "Decline" },
                            { v: "pending", label: "Keep pending" },
                          ].map((o) => (
                            <Label key={o.v} htmlFor={`s-${o.v}`}
                              className={`flex cursor-pointer items-center gap-2 rounded-md border bg-white p-2 text-sm ${sandboxChoice === o.v ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200"}`}>
                              <RadioGroupItem id={`s-${o.v}`} value={o.v} />{o.label}
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
