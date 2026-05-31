import { Card, CardContent } from "../../components/ui/card";

export default function AdminTransactions() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">Transactions</h1><p className="text-sm text-slate-500">Inspect payment transactions and process eligible refunds.</p></div>
      <Card className="border-slate-200"><CardContent className="p-10 text-center text-sm text-slate-500">Admin transactions API is not connected yet.</CardContent></Card>
    </div>
  );
}
