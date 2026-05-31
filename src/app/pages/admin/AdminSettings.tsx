import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { StatusBadge } from "../../components/StatusBadge";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";

export default function AdminSettings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500">Safe public/admin configuration. Secrets are managed in the backend.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Environment</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row k="Environment" v={<StatusBadge status="processing">Sandbox</StatusBadge>} />
            <Row k="API base URL" v={<span className="font-mono">https://api.securepay.example/v1</span>} />
            <Row k="Frontend version" v="v0.9.0" />
            <Row k="Public Stripe key" v={<StatusBadge status="healthy">Configured</StatusBadge>} />
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Active payment providers</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row k="Stripe" v={<StatusBadge status="healthy">Enabled</StatusBadge>} />
            <Row k="Sandbox Bank" v={<StatusBadge status="healthy">Enabled</StatusBadge>} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Operational preferences</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Toggle label="Enable webhook auto-replay for failed events" defaultChecked />
            <Toggle label="Notify on consecutive callback failures" defaultChecked />
            <Toggle label="Require admin reason for refunds" defaultChecked />
            <Toggle label="Show technical details by default" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Secrets</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Secrets such as Stripe secret keys, webhook secrets, signing keys, and KMS material are never exposed to this dashboard. They are managed in the backend's secret store.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">{k}</span><span>{v}</span></div>;
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <Label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
      <span>{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </Label>
  );
}
