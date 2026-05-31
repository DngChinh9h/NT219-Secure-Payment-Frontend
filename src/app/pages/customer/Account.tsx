import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const { user } = useApp();
  if (!user) {
    return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Please sign in to view your account.</div>;
  }

  const maskedIdentity = maskIdentity(user.citizenId);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-slate-500">Manage your personal information and shipping details.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="text-base">Personal information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={user.fullName} />
            <Field label="Email" value={user.email} />
            <Field label="Shipping address" className="sm:col-span-2" value={user.address ?? "Not available"} />
            <Field label="Identity number" className="sm:col-span-2" value={maskedIdentity} />
          </CardContent>
        </Card>
        <Card className="h-fit border-slate-200">
          <CardHeader><CardTitle className="text-base">Account security</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <div>Your personal information is protected and used only for order and payment verification.</div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => toast.message("Change password API is not connected yet.")}>Change password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function maskIdentity(identity?: string): string {
  if (!identity) return "Not available";
  if (identity.length <= 4) return "*".repeat(identity.length);
  return `${"*".repeat(identity.length - 4)}${identity.slice(-4)}`;
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      <Input value={value} readOnly className="bg-slate-50" />
    </div>
  );
}
