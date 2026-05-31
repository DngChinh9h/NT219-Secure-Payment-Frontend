import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { useApp } from "../lib/store";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { ShoppingCart, User as UserIcon, ShieldCheck, LogOut, ChevronDown } from "lucide-react";

const NAV = [
  { to: "/shop", label: "Home" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "My Orders" },
  { to: "/transactions", label: "Transactions" },
  { to: "/receipts", label: "Receipts" },
  { to: "/account", label: "Account" },
];

export default function CustomerLayout() {
  const { user, cart, logout } = useApp();
  const navigate = useNavigate();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/shop"><Logo /></Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <NavLink
                  key={n.to} to={n.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`
                  }>
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/cart")} className="relative">
              <ShoppingCart className="h-4 w-4" />
              <span className="ml-1.5 hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <Badge className="ml-2 h-5 min-w-5 rounded-full bg-indigo-600 px-1.5 text-[11px]">{cartCount}</Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="hidden gap-1.5 sm:flex">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                      {user.fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="hidden text-sm sm:inline">{user.fullName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <UserIcon className="mr-2 h-4 w-4" /> Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => navigate("/login")}>Sign in</Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-3"><Logo subtle /></div>
          <div>© 2026 SecurePay Gateway. Secure online shopping & payments.</div>
        </div>
      </footer>
    </div>
  );
}
