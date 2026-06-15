import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  Signal,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!user) return;

    const qOrders = query(collection(db, "orders"), where("uid", "==", user.uid));

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      data.sort(
        (a: any, b: any) =>
          (b.timestamp?.toMillis?.() ?? 0) -
          (a.timestamp?.toMillis?.() ?? 0)
      );

      setOrders(data);
      setLoadingOrders(false);
    });

    const qTx = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid)
    );

    const unsubTx = onSnapshot(qTx, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      data.sort(
        (a: any, b: any) =>
          (b.timestamp?.toMillis?.() ?? 0) -
          (a.timestamp?.toMillis?.() ?? 0)
      );

      setTransactions(data);
      setLoadingTx(false);
    });

    return () => {
      unsubOrders();
      unsubTx();
    };
  }, [user]);

  /* ================= FIXED TOTAL ================= */

  const totalSpent = orders.reduce((sum, o) => {
    const amount =
      o.amountPaid ??
      o.price ??
      o.amount ??
      o.total ??
      o.originalPrice ??
      0;

    return sum + Number(amount);
  }, 0);

  const recentTx = transactions.slice(0, 5);

  const NETWORK_COLORS: Record<string, string> = {
    MTN: "#EAB308",
    Telecel: "#EF4444",
    AirtelTigo: "#3B82F6",
  };

  const getStatusBadge = (status: string) => {
    const cleanStatus = (status || "").toLowerCase();

    if (
      cleanStatus === "approved" ||
      cleanStatus === "completed" ||
      cleanStatus === "delivered"
    ) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
          {status || "Delivered"}
        </Badge>
      );
    }

    if (cleanStatus === "rejected" || cleanStatus === "failed") {
      return (
        <Badge variant="destructive" className="text-xs">
          {status}
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
        {status || "Pending"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

        <p className="text-muted-foreground text-sm">
          Your middletownshop overview
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Wallet Balance</CardTitle>

            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-black">
              GHS {profile?.walletBalance?.toFixed(2) ?? "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Total Orders</CardTitle>

            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-black">
              {loadingOrders ? "—" : orders.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Total Spent</CardTitle>

            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-black text-orange-600">
              GHS {loadingOrders ? "—" : totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Transactions</CardTitle>

            <History className="h-4 w-4 text-purple-500" />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-black">
              {loadingTx ? "—" : transactions.length}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* QUICK ACTIONS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <Button asChild className="h-14 text-base font-semibold">
          <Link href="/dashboard/bundles">
            <Signal className="h-5 w-5 mr-2" />
            Buy Bundles
          </Link>
        </Button>

        <Button
          asChild
          className="h-14 text-base font-semibold bg-purple-600 hover:bg-purple-700"
        >
          <Link href="/dashboard/shop">
            <Zap className="h-5 w-5 mr-2" />
            Shop Products
          </Link>
        </Button>

        <Button
          asChild
          className="h-14 text-base font-semibold bg-red-600 hover:bg-red-700"
        >
          <Link href="/dashboard/deposit">
            <ArrowDownToLine className="h-5 w-5 mr-2" />
            Deposit
          </Link>
        </Button>

        <Button
          asChild
          className="h-14 text-base font-semibold bg-yellow-600 hover:bg-yellow-700"
        >
          <Link href="/dashboard/withdraw">
            <ArrowUpFromLine className="h-5 w-5 mr-2" />
            Withdraw
          </Link>
        </Button>

      </div>

      {/* RECENT ORDERS */}
      <div className="grid gap-6 lg:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingOrders ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted animate-pulse"
                />
              ))
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No orders yet
              </p>
            ) : (
              orders.slice(0, 5).map((order) => {

                const amount =
                  order.amountPaid ??
                  order.price ??
                  order.amount ??
                  order.total ??
                  order.originalPrice ??
                  0;

                return (
                  <div
                    key={order.id}
                    className="flex justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        {order.network} •{" "}
                        {order.recipientPhone ||
                          order.phoneNumber ||
                          order.number ||
                          "N/A"}
                      </p>

                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />

                        {order.timestamp
                          ? format(order.timestamp.toDate(), "MMM d, HH:mm")
                          : "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        GHS {Number(amount).toFixed(2)}
                      </p>

                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* RECENT TRANSACTIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>

          <CardContent>
            {recentTx.map((tx) => (
              <div
                key={tx.id}
                className="p-3 border rounded-lg mb-2"
              >
                <p className="font-semibold">{tx.type}</p>

                <p>
                  GHS {Number(tx.amount || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}