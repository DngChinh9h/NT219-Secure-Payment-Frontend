import { Card, CardContent } from "../../components/ui/card";

export default function AdminOrders() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">Orders</h1><p className="text-sm text-slate-500">Investigate orders and sync payment state with providers.</p></div>
      <Card className="border-slate-200"><CardContent className="p-10 text-center text-sm text-slate-500">Admin orders API is not connected yet.</CardContent></Card>
    </div>
  );
}
