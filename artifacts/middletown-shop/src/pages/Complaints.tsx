import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/useAuth";
import { useLocation } from "wouter";

import {
  MessageSquare,
  Plus,
  Clock,
} from "lucide-react";

export default function Complaints() {
  const { user, profile } = useAuth();
  const [, navigate] = useLocation();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    let q;

    if (profile.role === "admin") {
      q = query(collection(db, "complaints"));
    } else {
      q = query(
        collection(db, "complaints"),
        where("uid", "==", user.uid)
      );
    }

    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setComplaints(data);
      setLoading(false);
    });
  }, [user, profile]);

  return (
    <div className="max-w-4xl mx-auto p-4">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Complaints
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your submitted complaints
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/complaints/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white"
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          Loading complaints...
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 border rounded-xl">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p>No complaints found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="border rounded-xl p-4 bg-card"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {complaint.subject || "Complaint"}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {complaint.category || "General"}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    complaint.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {complaint.status || "pending"}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-3">
                {complaint.description ||
                  complaint.message}
              </p>

              {complaint.adminReply && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border">
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    Admin Reply
                  </p>
                  <p className="text-sm text-blue-900">
                    {complaint.adminReply}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {complaint.createdAt?.toDate?.()?.toLocaleString?.() ||
                  "Recently"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}