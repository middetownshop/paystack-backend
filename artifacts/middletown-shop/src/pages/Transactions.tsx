import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Transactions() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a: any, b: any) => {
        const aTime =
          a.timestamp?.toMillis?.() ||
          a.createdAt?.toMillis?.() ||
          0;

        const bTime =
          b.timestamp?.toMillis?.() ||
          b.createdAt?.toMillis?.() ||
          0;

        return bTime - aTime;
      });

      setTransactions(data);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
            Completed
          </Badge>
        );

      case "approved":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/50">
            Approved
          </Badge>
        );

      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;

      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/50">
            Pending
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-green-500/20 text-green-600">Deposit</Badge>;

      case "withdrawal":
        return <Badge className="bg-orange-500/10 text-orange-500">Withdrawal</Badge>;

      case "purchase":
        return <Badge className="bg-purple-500/10 text-purple-500">Purchase</Badge>;

      default:
        return <Badge variant="outline">{type || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h2 className="text-2xl font-bold">Transactions</h2>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.timestamp || tx.createdAt
                        ? format(
                            (tx.timestamp || tx.createdAt).toDate(),
                            "MMM d, yyyy HH:mm"
                          )
                        : "Pending"}
                    </TableCell>

                    <TableCell>{getTypeBadge(tx.type)}</TableCell>

                    <TableCell className="font-bold text-green-600">
                      +₵{Number(tx.businessAmount ?? tx.amount ?? 0).toFixed(2)}
                    </TableCell>

                    <TableCell>{getStatusBadge(tx.status)}</TableCell>

                    <TableCell className="text-sm text-gray-500">
                      {tx.note || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}