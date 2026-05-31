import { useApp } from "../../lib/store";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate, formatVND, shortId } from "../../lib/format";

export default function AdminTransactions() {
  const { transactions } = useApp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-slate-500">Inspect payment transactions and process eligible refunds.</p>
      </div>
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead><TableHead>Order</TableHead><TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
                <TableHead>Refund</TableHead><TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{shortId(t.id, "#")}</TableCell>
                  <TableCell className="font-mono text-sm">{shortId(t.orderId, "#")}</TableCell>
                  <TableCell className="text-sm">{t.customerEmail}</TableCell>
                  <TableCell><StatusBadge status={t.provider} /></TableCell>
                  <TableCell className="text-sm font-medium">{formatVND(t.amount)}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell><StatusBadge status={t.refundStatus} /></TableCell>
                  <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
