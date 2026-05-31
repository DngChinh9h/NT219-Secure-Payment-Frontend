import { useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../lib/format";
import { ChevronDown } from "lucide-react";
import type { AuditLog } from "../../lib/types";

const FILTERS = [
  { v: "all", label: "All" },
  { v: "payment", label: "Payments" },
  { v: "refund", label: "Refunds" },
  { v: "receipt", label: "Receipts" },
  { v: "admin", label: "Admin actions" },
  { v: "failed", label: "Failed" },
];

export default function AuditTrail() {
  const { auditLogs } = useApp();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => auditLogs.filter((l) => {
    if (filter === "all") return true;
    if (filter === "failed") return l.result !== "success";
    return l.event.includes(filter);
  }), [auditLogs, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit trail</h1>
          <p className="text-sm text-slate-500">An immutable record of every operational event.</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>{FILTERS.map((f) => <TabsTrigger key={f.v} value={f.v}>{f.label}</TabsTrigger>)}</TabsList>
        </Tabs>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Event</TableHead>
                <TableHead>Entity</TableHead><TableHead>Result</TableHead><TableHead>Integrity</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id} className="hover:bg-slate-50">
                  <TableCell className="text-sm">{formatDate(l.at)}</TableCell>
                  <TableCell className="text-sm">{l.actor}</TableCell>
                  <TableCell className="text-sm">{l.event}</TableCell>
                  <TableCell className="font-mono text-xs">{l.entity}</TableCell>
                  <TableCell><StatusBadge status={l.result} /></TableCell>
                  <TableCell><StatusBadge status={l.integrity} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(l)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[460px] sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{selected.id}</SheetTitle>
                <SheetDescription>Audit log entry</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Row k="Event" v={selected.event} />
                <Row k="Actor" v={selected.actor} />
                <Row k="Entity" v={<span className="font-mono">{selected.entity}</span>} />
                <Row k="Result" v={<StatusBadge status={selected.result} />} />
                <Row k="Integrity" v={<StatusBadge status={selected.integrity} />} />
                <Row k="Time" v={formatDate(selected.at)} />
                <Collapsible>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    Technical details (payload) <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 rounded-md bg-slate-900 p-3 text-[11px] text-slate-100">{selected.payload}</pre>
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
