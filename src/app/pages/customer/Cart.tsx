import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../../lib/store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { Minus, Plus, Trash2, ShieldCheck } from "lucide-react";
import { formatVND } from "../../lib/format";
import { toast } from "sonner";

export default function CartPage() {
  const { cart, products, updateCartQty, removeFromCart, createOrderFromCart, user } = useApp();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user?.address ?? "");

  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.productId)! }));
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const checkout = () => {
    if (!user) { toast.error("Please sign in first"); navigate("/login"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (!address.trim()) { toast.error("Please enter a shipping address"); return; }
    const order = createOrderFromCart(address);
    toast.success("Order created");
    navigate(`/checkout/${order.id}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <p className="text-sm text-slate-500">Review items and complete checkout securely.</p>
      </div>
      {items.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-slate-500">
            <div className="text-lg font-medium text-slate-700">Your cart is empty</div>
            <div className="text-sm">Your cart is empty. Start shopping to add products.</div>
            <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate("/shop")}>Continue shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-slate-200">
            <CardContent className="divide-y divide-slate-100 p-0">
              {items.map((i) => (
                <div key={i.productId} className="flex gap-4 p-4">
                  <div className="h-20 w-20 overflow-hidden rounded-md bg-slate-100">
                    <ImageWithFallback src={i.product.image} alt={i.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="font-medium">{i.product.name}</div>
                      <div className="text-xs text-slate-500">{i.product.category}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border border-slate-200">
                        <Button variant="ghost" size="icon" onClick={() => updateCartQty(i.productId, i.quantity - 1)}><Minus className="h-3.5 w-3.5" /></Button>
                        <div className="w-8 text-center text-sm">{i.quantity}</div>
                        <Button variant="ghost" size="icon" onClick={() => updateCartQty(i.productId, i.quantity + 1)}><Plus className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-indigo-700">{formatVND(i.product.price * i.quantity)}</div>
                        <button className="mt-1 inline-flex items-center gap-1 text-xs text-rose-600 hover:underline" onClick={() => removeFromCart(i.productId)}>
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Shipping address</CardTitle></CardHeader>
              <CardContent>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, ward, district, city" />
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader><CardTitle className="text-base">Order summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatVND(subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Shipping</span><span>Calculated at checkout</span></div>
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-base font-semibold"><span>Estimated total</span><span className="text-indigo-700">{formatVND(subtotal)}</span></div>
                  <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Final amount will be confirmed by the server when the order is created.
                  </div>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={checkout}>Create order</Button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout by SecurePay
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
