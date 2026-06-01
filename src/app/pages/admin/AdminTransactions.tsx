import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { StatusBadge } from "../../components/StatusBadge";
import { adminService, type AdminTransaction } from "../../services";
import { formatDate, formatVND, shortId } from "../../lib/format";
import { RefreshCw } from "lucide-react";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransactions(await adminService.getTransactions());
    } catch (loadError) {
      setTransactions([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load admin transactions.");
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
        <div><h1 className="text-2xl font-semibold tracking-tight">Transactions</h1><p className="text-sm text-slate-500">Inspect provider references and refund state for payment transactions.</p></div>
        <Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{loading ? "Refreshing..." : "Refresh"}</Button>
      </div>
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">Unable to load admin transactions: {error}</div>}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table data-testid="admin-transactions-table">
            <TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Provider</TableHead><TableHead>Provider reference</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Refund</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-xs">{shortId(transaction.id, "#")}</TableCell>
                  <TableCell className="font-mono text-xs">{shortId(transaction.orderId, "#")}</TableCell>
                  <TableCell>{transaction.customerEmail}</TableCell>
                  <TableCell>{transaction.provider ? <StatusBadge status={transaction.provider} /> : "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{transaction.providerPaymentId ?? "—"}</TableCell>
                  <TableCell>{formatVND(transaction.amount)}</TableCell>
                  <TableCell><StatusBadge status={transaction.status} /></TableCell>
                  <TableCell className="font-mono text-xs">{transaction.refundId ?? "—"}</TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-slate-500">{loading ? "Loading admin transactions..." : "No transactions returned by the API."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
