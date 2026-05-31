import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Logo } from "../../components/Logo";
import { useApp } from "../../lib/store";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", fullName: "", address: "", citizenId: "" });
  const { register } = useApp();
  const navigate = useNavigate();

  const rules = [
    { label: "At least 8 characters", ok: form.password.length >= 8 },
    { label: "Mix of letters and numbers", ok: /\d/.test(form.password) && /[a-zA-Z]/.test(form.password) },
    { label: "At least one special character", ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) { toast.error("Please fill required fields"); return; }
    if (!rules.every((r) => r.ok)) { toast.error("Password doesn't meet the requirements"); return; }
    register(form);
    toast.success("Your SecurePay account is ready");
    navigate("/shop");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-8">
          <div className="flex items-center justify-between">
            <Logo />
            <Link to="/login" className="text-sm text-slate-500 hover:text-slate-900">Sign in</Link>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Create your SecurePay account</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your personal information is protected and used only for order and payment verification.
            </p>
          </div>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g., Nguyen Van A" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Shipping address</Label>
              <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, ward, district, city" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="citizenId">Identity number</Label>
              <Input id="citizenId" value={form.citizenId} onChange={(e) => set("citizenId", e.target.value)} placeholder="Citizen ID (for order verification)" />
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div className="mb-2 text-xs font-medium text-slate-600">Password requirements</div>
              <ul className="space-y-1 text-xs">
                {rules.map((r) => (
                  <li key={r.label} className={`flex items-center gap-2 ${r.ok ? "text-emerald-700" : "text-slate-500"}`}>
                    {r.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} {r.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Create account</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
