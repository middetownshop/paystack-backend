import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/useAuth";
import { Shield, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { AdminErrorBoundary } from "@/components/AdminErrorBoundary";

interface Complaint {
  id: string;
  uid: string;
  userName: string;
  email: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  createdAt: Timestamp;
}

function AdminComplaintsContent() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Complaint)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-bold text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">You don't have admin privileges</p>
      </div>
    );
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, "complaints", id), { status, resolvedAt: new Date() });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  const formatDate = (ts: Timestamp) => {
    if (!ts?.toDate) return "";

    return ts.toDate().toLocaleString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusColor = (s: string) => {
    if (s === "resolved") return "bg-primary/10 text-primary";
    if (s === "rejected") return "bg-destructive/10 text-destructive";
    return "bg-amber-50 text-amber-600";
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints Management</h1>
          <p className="text-muted-foreground text-sm">{complaints.length} total complaints</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {["all", "pending", "resolved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No complaints in this category</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">{c.userName} • {c.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{c.category}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                  {c.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(c.id, "resolved")}
                        disabled={updating === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-60 transition-colors"
                      >
                        {updating === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Resolve
                      </button>
                      <button
                        onClick={() => updateStatus(c.id, "rejected")}
                        disabled={updating === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-60 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminComplaints() {
  return (
    <AdminErrorBoundary>
      <AdminComplaintsContent />
    </AdminErrorBoundary>
  );
}
