import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Logo } from "../../components/Logo";
import { useApp } from "../../lib/store";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login } = useApp();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success("Welcome back to SecurePay");
      navigate(user.role === "admin" ? "/admin" : "/shop");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 p-10 text-white lg:flex">
        <Logo />
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight">A trusted way to shop and pay online.</h1>
          <p className="max-w-md text-indigo-100">
            Browse products, place orders, and pay with confidence. Your personal information is protected and used only
            for order and payment verification.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-200"><Lock className="h-4 w-4" /> Protected by SecurePay Gateway</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-8">
            <div className="lg:hidden"><Logo /></div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Sign in to SecurePay</h2>
              <p className="mt-1 text-sm text-slate-500">Use your account to continue shopping.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="text-sm text-slate-600">
              New to SecurePay?{" "}
              <Link to="/register" className="font-medium text-indigo-600 hover:underline">Create your account</Link>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              Your personal information is protected and used only for order and payment verification.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
