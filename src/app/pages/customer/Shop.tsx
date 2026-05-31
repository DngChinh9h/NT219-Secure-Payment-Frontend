import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useApp } from "../../lib/store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { formatVND } from "../../lib/format";
import { Search, ShoppingCart, ShieldCheck, Truck, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["All", "Kits", "Devices", "Cloud", "Integration", "Learning", "Compliance"];

export default function ShopPage() {
  const { products, addToCart } = useApp();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(
    () => products.filter((p) =>
      (category === "All" || p.category === category) &&
      (q === "" || p.name.toLowerCase().includes(q.toLowerCase())),
    ), [products, q, category],
  );

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-700 to-blue-800 p-8 text-white sm:p-12">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-20 md:block"
          style={{ background: "radial-gradient(circle at 30% 50%, white, transparent 60%)" }} />
        <div className="relative max-w-2xl space-y-4">
          <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
            <Sparkles className="mr-1 h-3 w-3" /> New gateway release
          </Badge>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Shop with confidence. Pay with peace of mind.
          </h1>
          <p className="max-w-xl text-indigo-100">
            Discover secure payment products, hardware, and integration packages — backed by SecurePay Gateway.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
              Start shopping
            </Button>
            <Button variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Learn more
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Secure payments", text: "Card details handled by trusted payment providers." },
          { icon: Truck, title: "Fast fulfillment", text: "Most orders shipped within one business day." },
          { icon: Star, title: "Loved by 50k+", text: "Customers across Southeast Asia trust SecurePay." },
        ].map((b) => (
          <div key={b.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-700"><b.icon className="h-4 w-4" /></div>
            <div>
              <div className="text-sm font-medium">{b.title}</div>
              <div className="text-xs text-slate-500">{b.text}</div>
            </div>
          </div>
        ))}
      </section>

      <section id="products" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Featured products</h2>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search products..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                category === c ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}>{c}</button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-slate-200 transition hover:shadow-md">
              <Link to={`/product/${p.id}`} className="block">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <ImageWithFallback src={p.image} alt={p.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
              </Link>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{p.category}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating} · {p.sold} sold</span>
                </div>
                <Link to={`/product/${p.id}`} className="block">
                  <div className="font-medium leading-snug text-slate-900 hover:text-indigo-700">{p.name}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</div>
                </Link>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-lg font-semibold text-indigo-700">{formatVND(p.price)}</div>
                  <Button size="sm" variant="outline" onClick={() => { addToCart(p.id); toast.success("Added to cart"); }}>
                    <ShoppingCart className="mr-1.5 h-4 w-4" />Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
