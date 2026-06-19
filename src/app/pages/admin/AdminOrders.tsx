import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { StatusBadge } from "../../components/StatusBadge";
import { adminService, type AdminOrder } from "../../services";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { RefreshCw } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await adminService.getOrders());
    } catch (loadError) {
      setOrders([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load admin orders.");
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
        <div><h1 className="text-2xl font-semibold tracking-tight">Orders</h1><p className="text-sm text-slate-500">Investigate orders and their provider state.</p></div>
        <Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{loading ? "Refreshing..." : "Refresh"}</Button>
      </div>
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">Unable to load admin orders: {error}</div>}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table data-testid="admin-orders-table">
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Merchant / Payee</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Provider</TableHead><TableHead>Transactions</TableHead><TableHead>Refund</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{shortId(order.id, "#")}</TableCell>
                  <TableCell>{order.customerEmail}</TableCell>
                  <TableCell>{order.merchantName ?? order.merchantId ?? "â€”"}</TableCell>
                  <TableCell>{formatVND(order.amount)}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell>{order.provider ? <StatusBadge status={order.provider} /> : "—"}</TableCell>
                  <TableCell>{order.transactionCount}</TableCell>
                  <TableCell>{order.refundStatus ? <StatusBadge status={order.refundStatus} /> : "—"}</TableCell>
                  <TableCell>{formatDate(order.updatedAt)}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-slate-500">{loading ? "Loading admin orders..." : "No orders returned by the API."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
