import { useState } from "react";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Users,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function AgentRegister() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const AGENT_FEE = 50;


  const handleBecomeAgent = async () => {
    try {
      if (!user || !profile) {
        alert("User profile not loaded");
        return;
      }

      if ((profile.walletBalance || 0) < AGENT_FEE) {
        alert("Insufficient wallet balance");
        return;
      }

      setLoading(true);

      // Update user role and deduct wallet balance
      await updateDoc(doc(db, "users", user.uid), {
        role: "agent",
        walletBalance: increment(-AGENT_FEE),
        updatedAt: serverTimestamp(),
      });

      // Save transaction
      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "agent_registration",
        amount: AGENT_FEE,
        status: "completed",
        note: "Agent registration fee",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);

      alert("Congratulations! You are now an agent.");

      window.location.href = "/dashboard/agent";
    } catch (error) {
      console.error("Agent registration error:", error);
      alert("Failed to become agent");
    } finally {
      setLoading(false);
    }
  };

  // LOADING STATE
  if (!profile) {
    return (
      <div className="p-6 text-center">
        Loading...
      </div>
    );
  }

  // ALREADY AGENT
  if (
    profile.role === "agent" ||
    profile.role === "admin"
  ) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Card className="rounded-3xl border-green-200 bg-green-50">
          <CardContent className="py-10 text-center">
            <CheckCircle className="h-14 w-14 text-green-600 mx-auto mb-4" />

            <h2 className="text-2xl font-bold">
              Already an Agent
            </h2>

            <p className="text-muted-foreground mt-2">
              Your account already has agent access.
            </p>

            <Button
              className="mt-6"
              onClick={() =>
                (window.location.href =
                  "/dashboard/agent")
              }
            >
              Open Agent Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <Card className="rounded-3xl border shadow-sm overflow-hidden">
        {/* TOP */}
        <div className="bg-gradient-to-r from-red-600 to-yellow-500 p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Users className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-3xl font-black">
                Become Agent
              </h1>

              <p className="text-sm text-white/90 mt-1">
                Start earning commissions from bundle sales
              </p>
            </div>
          </div>
        </div>

        <CardHeader>
          <CardTitle>
            Agent Registration
          </CardTitle>

          <CardDescription>
            Pay a one-time fee to unlock the
            agent panel and earn commissions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* BENEFITS */}
          <div className="grid gap-3">
            <div className="rounded-2xl border p-4">
              <h3 className="font-semibold">
                Benefits
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  • Earn commission on bundle sales
                </li>

                <li>
                  • Access agent dashboard
                </li>

                <li>
                  • Track your referrals
                </li>

                <li>
                  • Monitor transactions
                </li>
              </ul>
            </div>

            {/* PRICE */}
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Registration Fee
                </p>

                <h2 className="text-3xl font-black text-yellow-700">
                  GHS {AGENT_FEE}
                </h2>
              </div>

              <Badge className="bg-yellow-500 hover:bg-yellow-500">
                One-Time Payment
              </Badge>
            </div>

            {/* WALLET */}
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">
                Your Wallet Balance
              </p>

              <h2 className="text-2xl font-black mt-1">
                GHS{" "}
                {Number(
                  profile.walletBalance || 0
                ).toFixed(2)}
              </h2>
            </div>
          </div>

          {/* BUTTON */}
          <Button
            onClick={handleBecomeAgent}
            disabled={
              loading ||
              success ||
              (profile.walletBalance || 0) <
                AGENT_FEE
            }
            className="w-full h-12 text-base font-bold rounded-2xl bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Become Agent Now"
            )}
          </Button>

          {(profile.walletBalance || 0) <
            AGENT_FEE && (
            <p className="text-sm text-red-600 text-center">
              You need at least GHS 50 in your wallet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}