import { Navigate, useLocation } from "react-router";
import { useApp } from "../lib/store";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Forbidden />;
  return <>{children}</>;
}

export function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md border-slate-200">
        <CardContent className="space-y-5 p-8 text-center">
          <div className="flex justify-center"><Logo /></div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Access restricted</h1>
            <p className="mt-1 text-sm text-slate-500">
              This area is reserved for SecurePay operators. If you believe this is a mistake, please contact your administrator.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate("/shop")}>Back to shop</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate("/login")}>Sign in</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
