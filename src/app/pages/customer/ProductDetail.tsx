import { Link, useNavigate, useParams } from "react-router";
import { useState } from "react";
import { useApp } from "../../lib/store";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { formatVND } from "../../lib/format";
import { ChevronLeft, Minus, Plus, ShoppingCart, ShieldCheck, Truck, Star } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const { products, addToCart } = useApp();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-slate-500">Product not found.</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate("/shop")}>Back to shop</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" /> Back to shop
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden border-slate-200">
          <div className="aspect-square bg-slate-100">
            <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
        </Card>
        <div className="space-y-5">
          <div>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">{product.category}</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span><span>·</span><span>{product.sold} sold</span>
            </div>
          </div>
          <div className="text-3xl font-semibold text-indigo-700">{formatVND(product.price)}</div>
          <p className="text-slate-600">{product.longDescription}</p>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border border-slate-200">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
              <div className="w-10 text-center text-sm">{qty}</div>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => q + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" onClick={() => { addToCart(product.id, qty); toast.success("Added to cart"); }}>
              <ShoppingCart className="mr-2 h-4 w-4" />Add to cart
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { addToCart(product.id, qty); navigate("/cart"); }}>
              Buy now
            </Button>
          </div>
          <Card className="border-slate-200">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="flex items-start gap-2 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-medium">Secure checkout</div>
                  <div className="text-slate-500">Card details are handled by the payment provider.</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Truck className="mt-0.5 h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-medium">Fast delivery</div>
                  <div className="text-slate-500">Most orders shipped within one business day.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
