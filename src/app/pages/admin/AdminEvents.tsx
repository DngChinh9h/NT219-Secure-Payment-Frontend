import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { StatusBadge } from "../../components/StatusBadge";
import { adminService, type AdminProviderEvent } from "../../services";
import { formatDate, shortId } from "../../lib/format";
import { RefreshCw } from "lucide-react";

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminProviderEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.getProviderEvents();
      setEvents(result.items);
      setMessage(result.message ?? null);
    } catch (loadError) {
      setEvents([]);
      setMessage(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load provider events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Provider events</h1><p className="text-sm text-slate-500">Inspect stored provider callbacks without exposing raw webhook payloads.</p></div>
        <Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{loading ? "Refreshing..." : "Refresh"}</Button>
      </div>
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">Unable to load provider events: {error}</div>}
      {message && <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table data-testid="admin-provider-events-table">
            <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Provider</TableHead><TableHead>Type</TableHead><TableHead>Provider event ID</TableHead><TableHead>Payment intent</TableHead><TableHead>Status</TableHead><TableHead>Received</TableHead><TableHead>Processed</TableHead></TableRow></TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs">{shortId(event.id, "#")}</TableCell>
                  <TableCell><StatusBadge status={event.provider} /></TableCell>
                  <TableCell>{event.eventType}</TableCell>
                  <TableCell className="font-mono text-xs">{event.providerEventId}</TableCell>
                  <TableCell className="font-mono text-xs">{event.relatedPaymentIntentId ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={event.status} /></TableCell>
                  <TableCell>{formatDate(event.receivedAt)}</TableCell>
                  <TableCell>{event.processedAt ? formatDate(event.processedAt) : "—"}</TableCell>
                </TableRow>
              ))}
              {events.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">{loading ? "Loading provider events..." : message ?? "No provider events returned by the API."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
