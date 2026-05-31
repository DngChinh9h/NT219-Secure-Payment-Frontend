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
  const [busy, setBusy] = useState(false);
  const { register } = useApp();
  const navigate = useNavigate();
  const rules = [
    { label: "At least 8 characters", ok: form.password.length >= 8 },
    { label: "At least one uppercase letter", ok: /[A-Z]/.test(form.password) },
    { label: "At least one number", ok: /\d/.test(form.password) },
  ];
  const set = <K extends keyof typeof form>(key: K, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.password || !form.fullName || !form.address || !form.citizenId) {
      toast.error("Please fill required fields");
      return;
    }
    if (!rules.every((rule) => rule.ok)) {
      toast.error("Password doesn't meet the requirements");
      return;
    }
    setBusy(true);
    try {
      const user = await register(form);
      toast.success("Your SecurePay account is ready");
      navigate(user.role === "admin" ? "/admin" : "/shop");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setBusy(false);
    }
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
            <p className="mt-1 text-sm text-slate-500">Your personal information is protected and used only for order and payment verification.</p>
          </div>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field id="fullName" label="Full name" value={form.fullName} onChange={(value) => set("fullName", value)} className="sm:col-span-2" placeholder="e.g., Nguyen Van A" />
            <Field id="email" label="Email" type="email" value={form.email} onChange={(value) => set("email", value)} placeholder="you@example.com" />
            <Field id="password" label="Password" type="password" value={form.password} onChange={(value) => set("password", value)} />
            <Field id="address" label="Shipping address" value={form.address} onChange={(value) => set("address", value)} className="sm:col-span-2" placeholder="Street, ward, district, city" />
            <Field id="citizenId" label="Identity number" value={form.citizenId} onChange={(value) => set("citizenId", value)} className="sm:col-span-2" placeholder="Citizen ID (for order verification)" />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
              <div className="mb-2 text-xs font-medium text-slate-600">Password requirements</div>
              <ul className="space-y-1 text-xs">
                {rules.map((rule) => (
                  <li key={rule.label} className={`flex items-center gap-2 ${rule.ok ? "text-emerald-700" : "text-slate-500"}`}>
                    {rule.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} {rule.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">{busy ? "Creating account..." : "Create account"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ id, label, value, onChange, className = "", placeholder, type = "text" }: {
  id: string; label: string; value: string; onChange: (value: string) => void; className?: string; placeholder?: string; type?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}
