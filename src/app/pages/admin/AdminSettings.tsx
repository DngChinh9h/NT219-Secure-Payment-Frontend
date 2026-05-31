import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/StatusBadge";
import { useApp } from "../../lib/store";
import { apiClient } from "../../services";

export default function AdminSettings() {
  const { publicConfig } = useApp();
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">Settings</h1><p className="text-sm text-slate-500">Safe public configuration. Secrets remain backend-only.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200"><CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <Row label="Environment" value={<StatusBadge status={publicConfig.environment === "sandbox" ? "processing" : "healthy"}>{publicConfig.environment}</StatusBadge>} />
          <Row label="API base URL" value={<span className="font-mono">{apiClient.baseUrl || "Not configured"}</span>} />
          <Row label="Public config API" value={<StatusBadge status={publicConfig.connected ? "healthy" : "unchecked"}>{publicConfig.connected ? "Connected" : "Not connected"}</StatusBadge>} />
          <Row label="Public Stripe key" value={<StatusBadge status={publicConfig.stripePublishableKey ? "healthy" : "unchecked"}>{publicConfig.stripePublishableKey ? "Configured" : "Not configured"}</StatusBadge>} />
        </CardContent></Card>
        <Card className="border-slate-200"><CardHeader><CardTitle className="text-base">Active payment providers</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
          <Row label="Stripe" value={<StatusBadge status={publicConfig.providers.stripe ? "healthy" : "unchecked"}>{publicConfig.providers.stripe ? "Enabled" : "Disabled"}</StatusBadge>} />
          <Row label="Sandbox Bank" value={<StatusBadge status={publicConfig.providers.mock_bank ? "healthy" : "unchecked"}>{publicConfig.providers.mock_bank ? "Enabled" : "Disabled"}</StatusBadge>} />
        </CardContent></Card>
        <Card className="border-slate-200 lg:col-span-2"><CardHeader><CardTitle className="text-base">Secrets</CardTitle></CardHeader><CardContent><div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Stripe secret keys, webhook secrets, signing keys, and KMS material are never exposed to this dashboard.</div></CardContent></Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><span className="text-slate-500">{label}</span><span className="text-right">{value}</span></div>;
}
