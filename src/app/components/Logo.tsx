import { Shield } from "lucide-react";

export function Logo({ subtle = false }: { subtle?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-sm">
        <Shield className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight text-slate-900">SecurePay</div>
        {!subtle && <div className="text-[11px] uppercase tracking-wider text-slate-500">Gateway</div>}
      </div>
    </div>
  );
}
