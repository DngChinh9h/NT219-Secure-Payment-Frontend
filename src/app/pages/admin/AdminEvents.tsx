import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../lib/format";
import { ChevronDown } from "lucide-react";
import type { ProviderEvent } from "../../lib/types";

const FILTERS = ["all", "processed", "failed", "duplicate", "stripe", "sandbox_bank"];

export default function AdminEvents() {
  const { providerEvents } = useApp();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<ProviderEvent | null>(null);

  const filtered = useMemo(() => providerEvents.filter((e) => {
    if (filter === "all") return true;
    if (filter === "stripe" || filter === "sandbox_bank") return e.provider === filter;
    return e.status === filter;
  }), [providerEvents, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Provider events</h1>
          <p className="text-sm text-slate-500">Inspect provider callbacks without leaving the operations console.</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {FILTERS.map((f) => <TabsTrigger key={f} value={f} className="capitalize">{f === "sandbox_bank" ? "Sandbox" : f}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead><TableHead>Provider</TableHead><TableHead>Type</TableHead>
                <TableHead>Payment reference</TableHead><TableHead>Status</TableHead>
                <TableHead>Received</TableHead><TableHead>Processed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell><StatusBadge status={e.provider} /></TableCell>
                  <TableCell className="text-sm">{e.eventType}</TableCell>
                  <TableCell className="font-mono text-xs">{e.paymentReference}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="text-sm">{formatDate(e.receivedAt)}</TableCell>
                  <TableCell className="text-sm">{e.processedAt ? formatDate(e.processedAt) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[500px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle className="font-mono">{selected.id}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row k="Provider" v={<StatusBadge status={selected.provider} />} />
                <Row k="Event type" v={selected.eventType} />
                <Row k="Status" v={<StatusBadge status={selected.status} />} />
                <Row k="Payment reference" v={<span className="font-mono">{selected.paymentReference}</span>} />
                <Row k="Received" v={formatDate(selected.receivedAt)} />
                <Row k="Processed" v={selected.processedAt ? formatDate(selected.processedAt) : "—"} />
                {selected.error && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800">
                    <div className="font-medium">Processing error</div>
                    <div className="text-xs">{selected.error}</div>
                  </div>
                )}
                <Collapsible>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    Technical details (raw payload) <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 overflow-auto rounded-md bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{selected.rawPayload}</pre>
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">{k}</span><span>{v}</span></div>;
}
