import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useApp } from "../../lib/store";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { StatusBadge } from "../../components/StatusBadge";
import { formatVND, shortId } from "../../lib/format";
import { CreditCard, Landmark, Lock, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import type { PaymentProvider } from "../../lib/types";
import type { PaymentIntentResult } from "../../services";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Badge } from "../../components/ui/badge";

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, loadOrder, payForOrder, publicConfig, dataLoading } = useApp();
  const order = orders.find((candidate) => candidate.id === orderId);
  const [method, setMethod] = useState<PaymentProvider>("stripe");
  const [sandboxChoice, setSandboxChoice] = useState<"approve" | "decline" | "pending">("approve");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentIntentResult | null>(null);

  const sandbox = publicConfig.environment === "sandbox";
  const stripePromise = useMemo(
    () => publicConfig.stripePublishableKey ? loadStripe(publicConfig.stripePublishableKey) : null,
    [publicConfig.stripePublishableKey],
  );
  const canPayMockBank = sandbox && publicConfig.providers.mock_bank;

  useEffect(() => {
    if (!orderId || order) return;
    loadOrder(orderId).catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load order."));
  }, [loadOrder, order, orderId]);

  if (!order) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        {dataLoading ? "Loading order..." : loadError ?? "Order not found."}
      </div>
    );
  }

  const showResult = (nextResult: PaymentIntentResult) => {
    setResult(nextResult);
    if (nextResult.status === "succeeded") toast.success("Payment completed");
    else if (nextResult.status === "failed") toast.error("Payment failed. You were not charged.");
    else toast.message("Payment is being processed");
  };

  const payMockBank = async () => {
    if (!canPayMockBank) {
      toast.error("Sandbox Bank is not available in the current public configuration.");
      return;
    }
    const paymentToken = { approve: "mock_success", decline: "mock_failed", pending: "mock_pending" }[sandboxChoice];
    setBusy(true);
    try {
      showResult(await payForOrder(order.id, "mock_bank", paymentToken));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <p className="text-sm text-slate-500">Complete your secure payment to confirm the order.</p>
        </div>
        <div className="flex items-center gap-2">
          {sandbox && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              <FlaskConical className="mr-1 h-3 w-3" /> Sandbox environment
            </Badge>
          )}
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base">Payment method</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={method} onValueChange={(value) => setMethod(value as PaymentProvider)} className="grid gap-3 sm:grid-cols-2">
                <Label htmlFor="m-stripe" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "stripe" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>
                  <RadioGroupItem id="m-stripe" value="stripe" className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-indigo-600" />Card payment</div>
                    <div className="text-xs text-slate-500">Stripe secure payment field</div>
                  </div>
                </Label>
                {sandbox && publicConfig.providers.mock_bank && (
                  <Label htmlFor="m-sandbox" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${method === "mock_bank" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"}`}>
                    <RadioGroupItem id="m-sandbox" value="mock_bank" className="mt-0.5" />
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
                    <div className="flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" /> Stripe secure card field</div>
                    {stripePromise ? (
                      <Elements stripe={stripePromise}>
                        <StripeCardCheckout
                          disabled={!!result}
                          orderId={order.id}
                          serverTotal={order.amount}
                          onResult={showResult}
                        />
                      </Elements>
                    ) : (
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Card payment is unavailable because the public Stripe key was not returned by the backend.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {method === "mock_bank" && sandbox && (
                <div className="mt-5 space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4 text-indigo-600" />Pay with Sandbox Bank</div>
                    <div className="mt-1 text-xs text-slate-500">The backend will process the selected sandbox outcome.</div>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Developer sandbox response</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <RadioGroup value={sandboxChoice} onValueChange={(value) => setSandboxChoice(value as typeof sandboxChoice)} className="mt-2 grid gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-3 sm:grid-cols-3">
                        {[{ v: "approve", label: "Approve" }, { v: "decline", label: "Decline" }, { v: "pending", label: "Keep pending" }].map((option) => (
                          <Label key={option.v} htmlFor={`s-${option.v}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white p-2 text-sm">
                            <RadioGroupItem id={`s-${option.v}`} value={option.v} />{option.label}
                          </Label>
                        ))}
                      </RadioGroup>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {!publicConfig.connected && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Public payment configuration API is not connected yet. Payment providers stay disabled until the backend exposes `/api/config/public`.
                </div>
              )}
              {method === "mock_bank" && (
                <>
                  <Button disabled={busy || !!result || !canPayMockBank} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700" onClick={payMockBank}>
                    {busy ? "Processing..." : `Pay ${formatVND(order.amount)} securely`}
                  </Button>
                  <PaymentSourceOfTruth />
                </>
              )}
            </CardContent>
          </Card>

          {result && (
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Payment result</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-start gap-3 rounded-lg border p-4 ${result.status === "succeeded" ? "border-emerald-200 bg-emerald-50" : result.status === "failed" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
                  {result.status === "succeeded" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />}
                    <div className="text-sm">
                      <div className="font-medium">{result.status === "succeeded" ? "Payment completed" : result.status === "failed" ? "Payment failed. You were not charged." : "Payment is processing"}</div>
                    <div className="text-slate-600">Payment attempt: <span className="font-mono">{result.paymentAttemptId || "â€”"}</span></div>
                    <div className="text-slate-600">Provider payment ID: <span className="font-mono">{result.providerPaymentId || "â€”"}</span></div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/orders")}>View my orders</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit border-slate-200">
          <CardHeader><CardTitle className="text-base">Order summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-500"><span>Order ID</span><span className="font-mono text-slate-900">{shortId(order.id, "#")}</span></div>
            <div className="space-y-2 border-y border-slate-100 py-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-3">
                  <div><div className="font-medium">{item.name}</div><div className="text-xs text-slate-500">Qty {item.quantity}</div></div>
                  <div>{formatVND(item.unitPrice * item.quantity)}</div>
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

function StripeCardCheckout({
  serverTotal,
  disabled,
  onResult,
  orderId,
}: {
  serverTotal: number;
  disabled: boolean;
  onResult: (result: PaymentIntentResult) => void;
  orderId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { payForOrder, syncPayment } = useApp();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !elements || !card || !cardComplete) return;

    setBusy(true);
    setCardError(null);
    try {
      const paymentMethodResult = await stripe.createPaymentMethod({
        type: "card",
        card,
      });
      if (paymentMethodResult.error || !paymentMethodResult.paymentMethod) {
        throw new Error(paymentMethodResult.error?.message ?? "Unable to create a secure card payment method.");
      }

      const created = await payForOrder(orderId, "stripe", paymentMethodResult.paymentMethod.id);
      let status = created.status;

      if (created.clientSecret && (status === "requires_action" || status === "requires_confirmation")) {
        const confirmation = await stripe.confirmCardPayment(created.clientSecret);
        if (confirmation.error) {
          throw new Error(confirmation.error.message ?? "Stripe could not confirm this card payment.");
        }
        status = confirmation.paymentIntent?.status ?? status;
      }

      const synced = await syncPayment(created.providerPaymentId || created.paymentIntentId);
      onResult({
        ...created,
        status: String(synced.providerStatus ?? status),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process payment.";
      setCardError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mt-3 rounded-md border border-slate-300 bg-slate-50 p-4" data-testid="stripe-card-element">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#0f172a",
                fontFamily: "system-ui, sans-serif",
                fontSize: "16px",
                "::placeholder": { color: "#94a3b8" },
              },
              invalid: { color: "#be123c" },
            },
          }}
          onChange={(event) => {
            setCardComplete(event.complete);
            setCardError(event.error?.message ?? null);
          }}
        />
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Card number, expiry date, and CVC are collected securely by Stripe.js and never sent to the SecurePay backend.
      </div>
      {cardError && <div className="mt-3 text-xs text-rose-700">{cardError}</div>}
      <Button disabled={busy || disabled || !stripe || !elements || !cardComplete} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => void pay()}>
        {busy ? "Processing..." : `Pay ${formatVND(serverTotal)} securely`}
      </Button>
      <PaymentSourceOfTruth />
    </>
  );
}

function PaymentSourceOfTruth() {
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
      <ShieldCheck className="h-3.5 w-3.5" /> Backend confirms payment status with the provider.
    </div>
  );
}
