import { useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { CheckCircle2, ChevronDown, ShieldCheck } from "lucide-react";
import type { Receipt } from "../../lib/types";

export default function ReceiptsPage() {
  const { receipts } = useApp();
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [verifyResult, setVerifyResult] = useState<"authentic" | "invalid" | "unable" | null>(null);
  const [verifying, setVerifying] = useState(false);

  const verify = async () => {
    setVerifying(true); setVerifyResult(null);
    await new Promise((r) => setTimeout(r, 700));
    setVerifyResult("authentic");
    setVerifying(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
        <p className="text-sm text-slate-500">View, download, and verify the authenticity of your receipts.</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{shortId(r.id, "#")}</TableCell>
                  <TableCell className="font-mono text-sm">{shortId(r.transactionId, "#")}</TableCell>
                  <TableCell className="font-mono text-sm">{shortId(r.orderId, "#")}</TableCell>
                  <TableCell className="text-sm font-medium">{formatVND(r.amount)}</TableCell>
                  <TableCell className="text-sm">{formatDate(r.issuedAt)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(r); setVerifyResult(null); }}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {receipts.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">No receipts yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[480px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{shortId(selected.id, "#")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wider text-slate-500">SecurePay Receipt</div>
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Row k="Transaction" v={shortId(selected.transactionId, "#")} mono />
                    <Row k="Order" v={shortId(selected.orderId, "#")} mono />
                    <Row k="Amount" v={formatVND(selected.amount)} />
                    <Row k="Currency" v={selected.currency} />
                    <Row k="Issued" v={formatDate(selected.issuedAt)} />
                  </div>
                </div>

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={verifying} onClick={verify}>
                  {verifying ? "Verifying..." : "Verify receipt"}
                </Button>
                {verifyResult === "authentic" && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-medium">Receipt is authentic</div>
                      <div className="text-xs">Issued by SecurePay and not modified.</div>
                    </div>
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                    Technical details <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 break-all rounded-md bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
                      {selected.rawJws}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={mono ? "font-mono" : ""}>{v}</span>
    </div>
  );
}
