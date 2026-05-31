import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../lib/format";
import { Activity, ShieldCheck } from "lucide-react";

export default function AdminOverview() {
  const { auditLogs, dataLoading, apiError } = useApp();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500">Payment operations backed by the connected API surface.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Orders" value="Not connected" />
        <Metric label="Transactions" value="Not connected" />
        <Metric label="Provider events" value="Not connected" />
        <Metric label="Audit records" value={dataLoading ? "Loading..." : auditLogs.length.toString()} />
      </div>
      <Card className="border-slate-200">
        <CardHeader><CardTitle className="text-base">Recent audit activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {apiError ? <Empty text={apiError} /> : auditLogs.length === 0 ? <Empty text={dataLoading ? "Loading audit activity..." : "No audit activity returned by the API."} /> : (
            <ul className="divide-y divide-slate-100">
              {auditLogs.slice(0, 8).map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-700"><Activity className="h-4 w-4" /></div>
                    <div className="min-w-0"><div className="truncate font-medium">{log.event}</div><div className="truncate text-xs text-slate-500">{log.actor} - {log.entity}</div></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3"><StatusBadge status={log.result} /><span className="text-xs text-slate-500">{formatDate(log.at)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card className="border-slate-200"><CardContent className="space-y-2 p-5"><div className="flex items-center justify-between text-xs text-slate-500"><span>{label}</span><ShieldCheck className="h-4 w-4 text-indigo-600" /></div><div className="text-xl font-semibold tracking-tight">{value}</div></CardContent></Card>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-slate-500">{text}</div>;
}
