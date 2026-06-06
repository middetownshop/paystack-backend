import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Redirect } from "wouter";
import { Users, DollarSign, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

const NETWORK_COLORS: Record<string, string> = {
  MTN: "#EAB308",
  Telecel: "#EF4444",
  AirtelTigo: "#3B82F6",
};

export default function AgentPanel() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile || (profile.role !== "agent" && profile.role !== "admin")) return;

    const unsubUsers = () => {
      setUsers([]);
    };

    // Orders where the agent's uid is the agentUid
    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), where("agentUid", "==", user.uid)),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
        setOrders(data);
      }
    );

    // Commission transactions earned by this agent
    const unsubCommissions = onSnapshot(
      query(collection(db, "transactions"), where("uid", "==", user.uid), where("type", "==", "commission")),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0));
        setCommissions(data);
        setLoading(false);
      }
    );

    return () => { unsubUsers(); unsubOrders(); unsubCommissions(); };
  }, [user, profile]);

  if (!profile) return null;
  if (profile.role !== "agent" && profile.role !== "admin") return <Redirect to="/dashboard" />;

  const totalSales = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const mtnSales = orders.filter(o => o.network === "MTN").length;
  const telecelSales = orders.filter(o => o.network === "Telecel").length;
  const airtelSales = orders.filter(o => o.network === "AirtelTigo").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Panel</h2>
          <p className="text-muted-foreground text-sm">Your sales performance and commissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-primary">GHS {loading ? "—" : totalCommission.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">5% of bundle sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">GHS {loading ? "—" : totalSales.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Bundle revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders Generated</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{loading ? "—" : orders.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Via your referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{users.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Network breakdown */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { name: "MTN", count: mtnSales, color: NETWORK_COLORS["MTN"] },
          { name: "Telecel", count: telecelSales, color: NETWORK_COLORS["Telecel"] },
          { name: "AirtelTigo", count: airtelSales, color: NETWORK_COLORS["AirtelTigo"] },
        ].map(net => (
          <Card key={net.name} className="overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: net.color }} />
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{net.name} Bundles</p>
                <p className="text-2xl font-black">{net.count}</p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: net.color }}>
                {net.name.charAt(0)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Commission Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />Commission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : commissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No commissions yet. Users linked to you need to purchase bundles.</p>
            ) : (
              <div className="space-y-2">
                {commissions.slice(0, 8).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.note || "Commission"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.timestamp ? format(c.timestamp.toDate(), "MMM d, HH:mm") : "—"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-green-600 shrink-0 ml-3">+GHS {c.amount?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders from assigned users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-500" />Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : orders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">No sales via your referrals yet.</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 8).map(order => {
                  const color = NETWORK_COLORS[order.network] || "#6B7280";
                  return (
                    <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
                        {order.network?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{order.network} {order.size}</p>
                        <p className="text-xs text-muted-foreground">{order.userName || "User"} · {order.timestamp ? format(order.timestamp.toDate(), "MMM d") : "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">GHS {order.price?.toFixed(2)}</p>
                        <p className="text-xs text-green-600">+{(order.price * 0.05).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All users table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Registered Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Wallet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users yet.</TableCell></TableRow>
              ) : (
                users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                    <TableCell className="text-right font-bold">GHS {u.walletBalance?.toFixed(2) ?? "0.00"}</TableCell>
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
