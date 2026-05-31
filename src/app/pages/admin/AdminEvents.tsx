import { Card, CardContent } from "../../components/ui/card";

export default function AdminEvents() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">Provider events</h1><p className="text-sm text-slate-500">Inspect provider callbacks without leaving the operations console.</p></div>
      <Card className="border-slate-200"><CardContent className="p-10 text-center text-sm text-slate-500">Provider events API is not connected yet.</CardContent></Card>
    </div>
  );
}
