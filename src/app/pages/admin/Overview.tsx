import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND } from "../../lib/format";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, Activity } from "lucide-react";

export default function AdminOverview() {
  const { orders, transactions, providerEvents, auditLogs } = useApp();
  const todayTxns = transactions.length;
  const succeeded = transactions.filter((t) => t.status === "succeeded").length;
  const failed = transactions.filter((t) => t.status === "failed").length;
  const refunded = transactions.filter((t) => t.status === "refunded").length;
  const pendingEvents = providerEvents.filter((e) => e.status !== "processed").length;

  const trend = [
    { d: "Mon", paid: 12, failed: 1 }, { d: "Tue", paid: 18, failed: 3 }, { d: "Wed", paid: 24, failed: 2 },
    { d: "Thu", paid: 21, failed: 4 }, { d: "Fri", paid: 32, failed: 2 }, { d: "Sat", paid: 28, failed: 5 },
    { d: "Sun", paid: 19, failed: 1 },
  ];
  const distribution = [
    { name: "Paid", value: succeeded, color: "#10b981" },
    { name: "Processing", value: transactions.filter((t) => t.status === "processing").length, color: "#3b82f6" },
    { name: "Failed", value: failed, color: "#f43f5e" },
    { name: "Refunded", value: refunded, color: "#8b5cf6" },
  ];
  const providers = [
    { name: "Stripe", value: transactions.filter((t) => t.provider === "stripe").length },
    { name: "Sandbox Bank", value: transactions.filter((t) => t.provider === "sandbox_bank").length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500">Today's payment activity and platform health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total payments today" value={todayTxns.toString()} delta="+12%" up icon={<Activity className="h-4 w-4" />} />
        <Metric label="Successful payments" value={formatVND(transactions.filter((t) => t.status === "succeeded").reduce((s, t) => s + t.amount, 0))} delta="+18%" up />
        <Metric label="Failed payments" value={failed.toString()} delta="-4%" down />
        <Metric label="Refunds" value={refunded.toString()} delta="0" />
        <Metric label="Pending provider events" value={pendingEvents.toString()} delta={pendingEvents > 0 ? "Needs review" : "Healthy"} warn={pendingEvents > 0} icon={<AlertTriangle className="h-4 w-4" />} />
        <Metric label="Security checks status" value="Healthy" delta="All checks passing" up icon={<ShieldCheck className="h-4 w-4" />} />
        <Metric label="Orders today" value={orders.length.toString()} delta="+8%" up />
        <Metric label="Audit integrity" value="Verified" delta="Last 24h" up />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Payment trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="d" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="paid" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Status distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {distribution.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Provider breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={providers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {auditLogs.slice(0, 8).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{l.event}</div>
                      <div className="truncate text-xs text-slate-500">{l.actor} · {l.entity}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={l.result} />
                    <span className="text-xs text-slate-500">{formatDate(l.at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, delta, up, down, warn, icon }: { label: string; value: string; delta?: string; up?: boolean; down?: boolean; warn?: boolean; icon?: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-2 p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className={`grid h-7 w-7 place-items-center rounded-md ${warn ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>{icon ?? <TrendingUp className="h-3.5 w-3.5" />}</span>
        </div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <div className={`flex items-center gap-1 text-xs ${up ? "text-emerald-600" : down ? "text-rose-600" : warn ? "text-amber-600" : "text-slate-500"}`}>
            {up && <TrendingUp className="h-3 w-3" />}{down && <TrendingDown className="h-3 w-3" />}<span>{delta}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
