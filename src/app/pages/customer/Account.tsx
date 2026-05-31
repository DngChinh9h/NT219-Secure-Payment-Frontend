import { useApp } from "../../lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const { user } = useApp();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    address: user?.address ?? "",
    citizenId: user?.citizenId ?? "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  if (!user) {
    return <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">Please sign in to view your account.</div>;
  }

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
            <Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Shipping address" className="sm:col-span-2" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Field label="Identity number" className="sm:col-span-2" value={form.citizenId} onChange={(v) => setForm({ ...form, citizenId: v })} />
            <div className="sm:col-span-2"><Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.success("Profile saved")}>Save changes</Button></div>
          </CardContent>
        </Card>
        <Card className="h-fit border-slate-200">
          <CardHeader><CardTitle className="text-base">Account security</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <div>Your personal information is protected and used only for order and payment verification.</div>
            </div>
            {!showPwd ? (
              <Button variant="outline" className="w-full" onClick={() => setShowPwd(true)}>Change password</Button>
            ) : (
              <div className="space-y-3 rounded-md border border-slate-200 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pwd-current" className="text-xs text-slate-600">Current password</Label>
                  <Input id="pwd-current" type="password" autoComplete="current-password"
                    value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pwd-new" className="text-xs text-slate-600">New password</Label>
                  <Input id="pwd-new" type="password" autoComplete="new-password"
                    value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pwd-confirm" className="text-xs text-slate-600">Confirm new password</Label>
                  <Input id="pwd-confirm" type="password" autoComplete="new-password"
                    value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowPwd(false); setPwd({ current: "", next: "", confirm: "" }); }}>Cancel</Button>
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      if (!pwd.current || !pwd.next || !pwd.confirm) { toast.error("Please fill in all fields."); return; }
                      if (pwd.next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
                      if (pwd.next !== pwd.confirm) { toast.error("New password and confirmation do not match."); return; }
                      if (pwd.next === pwd.current) { toast.error("New password must differ from current."); return; }
                      toast.success("Password updated.");
                      setShowPwd(false);
                      setPwd({ current: "", next: "", confirm: "" });
                    }}>
                    Update password
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
