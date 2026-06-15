import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { format } from "date-fns";
import {
  ShoppingBag,
  Clock,
  Phone,
  User,
  Copy,
  Check,
} from "lucide-react";

/* ================= COLORS ================= */

const NETWORK_COLORS: Record<string, { bg: string; text: string }> = {
  MTN: { bg: "#FACC15", text: "#000" },
  Telecel: { bg: "#EF4444", text: "#fff" },
  AirtelTigo: { bg: "#111827", text: "#fff" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  completed: "bg-green-500/20 text-green-300 border border-green-500/30",
  delivered: "bg-green-500/20 text-green-300 border border-green-500/30",
  failed: "bg-red-500/20 text-red-300 border border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
};

/* ================= COPY ================= */

const copyText = async (text: string, setCopied: (v: boolean) => void) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  } catch {}
};

/* ================= PRICE FIX ================= */

const getPrice = (order: any) => {
  return Number(order.amountPaid ?? order.originalPrice ?? order.price ?? 0);
};

/* ================= MAIN ================= */

export default function Orders() {
  const { user, profile } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkFilter, setNetworkFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let q;

    if (profile?.role === "admin") {
      q = query(collection(db, "orders"));
    } else {
      q = query(collection(db, "orders"), where("uid", "==", user.uid));
    }

    return onSnapshot(
      q,
      (snap) => {
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
        setLoading(false);
      },
      (err) => {
        console.error("[Orders] Firestore error:", err.code);
        setLoading(false);
      }
    );
  }, [user, profile]);
  
  const networks = useMemo(() => {
    return ["All", ...new Set(orders.map((o) => o.network))];
  }, [orders]);

  const filtered = orders.filter((o) => {
    return (
      (networkFilter === "All" || o.network === networkFilter) &&
      (statusFilter === "All" || o.status === statusFilter)
    );
  });

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "orders", id), {
      status,
      updatedAt: new Date(),
    });
  };

  return (
    <div className="min-h-screen p-3 bg-black text-white">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="h-6 w-6 text-yellow-400" />
        <div>
          <h2 className="text-lg font-bold">
            {profile?.role === "admin" ? "All Orders" : "My Orders"}
          </h2>
          <p className="text-xs text-gray-400">Bundle history</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 flex-wrap mb-3">
        {networks.map((net) => (
          <button
            key={net}
            onClick={() => setNetworkFilter(net)}
            className={`px-3 py-1 text-xs rounded-full border ${
              networkFilter === net
                ? "bg-yellow-400 text-black font-bold"
                : "bg-black border-gray-700 text-gray-300"
            }`}
          >
            {net}
          </button>
        ))}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-black border border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LIST */}
      {loading ? (
        <Skeleton className="h-24 bg-gray-800" />
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No orders found</p>
      ) : (
        filtered.map((order) => {
          const cfg = NETWORK_COLORS[order.network] || {
            bg: "#374151",
            text: "#fff",
          };

          const price = getPrice(order);
          const phone = order.recipientPhone || order.phone || "N/A";
          const isCopied = copiedId === order.id;

          return (
            <Card
              key={order.id}
              className="bg-gray-900 border border-gray-800 mb-3"
            >
              <CardContent className="p-3 space-y-3">

                {/* TOP */}
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                      {order.network?.charAt(0)}
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        {order.network} {order.size}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.validity || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">
                      GHS {price.toLocaleString()}
                    </p>

                    <Badge className={STATUS_COLORS[order.status]}>
                      {order.status || "pending"}
                    </Badge>
                  </div>
                </div>

                {/* PHONE */}
                <div className="flex justify-between bg-gray-100 p-2 rounded">
                  <span className="text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3 text-yellow-400" />
                    {phone}
                  </span>

                  {phone !== "N/A" && (
                    <button
                      onClick={() =>
                        copyText(phone, (v) =>
                          setCopiedId(v ? order.id : null)
                        )
                      }
                      className="text-xs text-yellow-400 flex items-center gap-1"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-green-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* USER */}
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <User className="h-3 w-3 text-red-400" />
                  {order.userName || "Customer"}
                </p>

                {/* 🔥 ADMIN DELIVERY CONTROL RESTORED */}
                {profile?.role === "admin" && (
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus(order.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-black border border-gray-700 text-white">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* DATE */}
                {order.timestamp && (
                  <p className="text-[10px] text-gray-500">
                    {format(order.timestamp.toDate(), "MMM d, HH:mm")}
                  </p>
                )}

              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}