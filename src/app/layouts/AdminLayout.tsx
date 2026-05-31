import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { useApp } from "../lib/store";
import { Button } from "../components/ui/button";
import {
  LayoutDashboard, ShoppingBag, Receipt, CreditCard, RotateCcw, Webhook,
  ShieldCheck, FileSearch, Settings, ArrowLeft, Bell,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/refunds", label: "Refunds", icon: RotateCcw },
  { to: "/admin/events", label: "Provider Events", icon: Webhook },
  { to: "/admin/security", label: "Security Operations", icon: ShieldCheck },
  { to: "/admin/audit", label: "Audit Trail", icon: FileSearch },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, loginAsAdmin } = useApp();
  useEffect(() => {
    if (!user || user.role !== "admin") loginAsAdmin();
  }, [user, loginAsAdmin]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link to="/admin"><Logo /></Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}>
              <n.icon className="h-4 w-4" />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => navigate("/shop")}>
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Button>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Payment Operations</div>
            <div className="text-sm font-medium text-slate-800">SecurePay Operations Console</div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">A</div>
              <div className="text-sm">
                <div className="leading-none">Admin</div>
                <div className="text-[11px] text-slate-500">admin@securepay.io</div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
