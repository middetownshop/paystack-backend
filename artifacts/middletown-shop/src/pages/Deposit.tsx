import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/useAuth";
import {
  ArrowDownToLine,
  Loader2,
  CheckCircle,
  XCircle,
  Wifi,
  Phone,
  Clock,
  ReceiptText,
  ShoppingBag,
  Zap,
} from "lucide-react";

const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500];

const NETWORK_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  MTN: { bg: "#EAB308", text: "#fff", emoji: "🟡" },
  Telecel: { bg: "#EF4444", text: "#fff", emoji: "🔴" },
  AirtelTigo: { bg: "#3B82F6", text: "#fff", emoji: "🔵" },
};

type VerifyState = "idle" | "verifying" | "success" | "failed";

type BundleOrder = {
  network: string;
  size: string;
  validity?: string;
  phone: string;
  amountGHS: number;
  reference: string;
};

export default function Deposit() {
  const { user, profile, refreshProfile } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [bundleOrder, setBundleOrder] = useState<BundleOrder | null>(null);

  // On load, check if returning from Paystack callback
  useEffect(() => {
    const params = new URLSearchParams(search);
    const reference = params.get("reference");
    if (!reference || !user || !profile) return;

    // Remove reference from URL without triggering navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("reference");
    window.history.replaceState({}, "", url.toString());

    setVerifyState("verifying");

    (async () => {
      try {
        const res = await fetch(
          `/api/paystack/verify/${encodeURIComponent(reference)}`
        );
        const text = await res.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error("Invalid response from server");
        }

        if (!json.success || json.data?.status !== "success") {
          setVerifyState("failed");
          setVerifyMessage(json.message || "Payment was not completed");
          return;
        }

        // Use server-extracted businessAmount — never tx.amount (includes fees)
        const businessAmount =
          Number(json.clean?.businessAmount) ||
          Number(json.data.metadata?.businessAmount);

        if (!businessAmount) {
          throw new Error("Missing businessAmount");
        }
        

        const meta = json.data.metadata || {};
        const paidGHS = businessAmount;
        console.log("VERIFY DEBUG", {
          cleanBusinessAmount: json.clean?.businessAmount,
          metadataBusinessAmount: json.data.metadata?.businessAmount,
          customerPaid: json.data.amount / 100,
        });

        
        if (meta.paymentType === "bundle_purchase") {
          // Create order in Firestore — do NOT touch wallet balance
          await addDoc(collection(db, "orders"), {
            uid: user.uid,
            userName: profile.name,
            bundleId: meta.bundleId || "",
            network: meta.network || "",
            size: meta.size || "",
            recipientPhone: meta.phone || "",
            amountPaid: paidGHS,
            paymentMethod: "paystack",
            reference,
            status: "completed",
            timestamp: serverTimestamp(),
          });

          setBundleOrder({
            network: meta.network || "Unknown",
            size: meta.size || "",
            validity: meta.validity,
            phone: meta.phone || "",
            amountGHS: paidGHS,
            reference,
          });

          setVerifyState("success");
          setVerifyMessage("bundle");
        } else {
          // Wallet deposit — existing behaviour
          await Promise.all([
            updateDoc(doc(db, "users", user.uid), {
              walletBalance: increment(paidGHS),
            }),
            addDoc(collection(db, "transactions"), {
              uid: user.uid,
              type: "deposit",
              businessAmount: paidGHS,
              reference,
              status: "completed",
              timestamp: serverTimestamp(),
            }),
          ]);

          await refreshProfile();
          setVerifyState("success");
          setVerifyMessage(`GHS ${paidGHS.toFixed(2)} added to your wallet`);
        }
      } catch (err: any) {
        setVerifyState("failed");
        setVerifyMessage(err.message || "Verification failed");
      }
    })();
  }, [search, user, profile]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !profile) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const callbackUrl =
        window.location.origin +
        (import.meta.env.BASE_URL || "/").replace(/\/$/, "") +
        "/dashboard/deposit";

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          amount: numAmount,
          callback_url: callbackUrl,
          metadata: { uid: user.uid, name: profile.name },
        }),
      });

      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!json.success || !json.data?.authorization_url) {
        throw new Error(json.message || "Could not initialize payment");
      }

      window.location.href = json.data.authorization_url;
    } catch (err: any) {
      setError(err.message || "Payment initialization failed");
      setLoading(false);
    }
  };

  // ── Bundle order confirmed — full-page confirmation ──────────────────────
  if (verifyState === "success" && bundleOrder) {
    const cfg = NETWORK_COLORS[bundleOrder.network] ?? {
      bg: "#6B7280",
      text: "#fff",
      emoji: "📶",
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Success icon */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="h-20 w-20 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${cfg.bg}20` }}
            >
              <Zap
                className="h-10 w-10"
                style={{ color: cfg.bg }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black">
                Bundle Confirmed!
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Your data bundle is being processed
              </p>
            </div>
          </div>

          {/* Order card */}
          <div
            className="rounded-3xl border-2 overflow-hidden shadow-md"
            style={{ borderColor: `${cfg.bg}40` }}
          >
            {/* Network header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: cfg.bg }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cfg.emoji}</span>
                <span
                  className="font-black text-lg"
                  style={{ color: cfg.text }}
                >
                  {bundleOrder.network}
                </span>
              </div>
              <span
                className="font-black text-2xl"
                style={{ color: cfg.text }}
              >
                {bundleOrder.size}
              </span>
            </div>

            {/* Details */}
            <div className="bg-white divide-y divide-gray-100">
              <div className="flex items-center gap-3 px-6 py-4">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="font-bold text-black font-mono">
                    {bundleOrder.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4">
                <Wifi className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Bundle</p>
                  <p className="font-bold text-black">
                    {bundleOrder.size}
                    {bundleOrder.validity ? ` · ${bundleOrder.validity}` : ""}
                  </p>
                </div>
              </div>

              {bundleOrder.validity && (
                <div className="flex items-center gap-3 px-6 py-4">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Validity</p>
                    <p className="font-bold text-black">
                      {bundleOrder.validity}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-6 py-4">
                <ReceiptText className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Amount Paid</p>
                  <p className="font-black text-xl text-black">
                    GHS {bundleOrder.amountGHS.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4">
                <ReceiptText className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Reference</p>
                  <p className="font-mono text-sm text-gray-700 truncate">
                    {bundleOrder.reference}
                  </p>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div
              className="px-6 py-3 flex items-center gap-2"
              style={{ backgroundColor: `${cfg.bg}10` }}
            >
              <CheckCircle
                className="h-4 w-4"
                style={{ color: cfg.bg }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: cfg.bg }}
              >
                Payment verified · Order placed
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard/quick-sell")}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 py-3 text-sm font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Zap className="h-4 w-4" />
              Buy Again
            </button>
            <button
              onClick={() => navigate("/dashboard/orders")}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-md transition-all"
              style={{ backgroundColor: cfg.bg }}
            >
              <ShoppingBag className="h-4 w-4" />
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal deposit page ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ArrowDownToLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Deposit Funds</h1>
          <p className="text-sm text-muted-foreground">
            Top up your wallet via Paystack
          </p>
        </div>
      </div>

      {/* Paystack callback result */}
      {verifyState === "verifying" && (
        <div className="rounded-lg border bg-card p-6 flex items-center gap-4">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <div>
            <p className="font-medium">Verifying your payment…</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      )}

      {verifyState === "success" && !bundleOrder && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 flex items-center gap-4">
          <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-700">Payment successful!</p>
            <p className="text-sm text-green-600">{verifyMessage}</p>
          </div>
        </div>
      )}

      {verifyState === "failed" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 flex items-center gap-4">
          <XCircle className="h-6 w-6 text-destructive shrink-0" />
          <div>
            <p className="font-medium text-destructive">Payment failed</p>
            <p className="text-sm text-destructive/80">{verifyMessage}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-lg">Enter Amount</h2>
          <p className="text-sm text-muted-foreground">
            Choose a preset or enter a custom amount (GHS)
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={`py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                  amount === String(preset)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                GHS {preset}
              </button>
            ))}
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Custom Amount (GHS)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  GHS
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full py-2.5 px-4 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to Paystack…
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4" />
                  Pay with Paystack
                  {amount &&
                  !isNaN(parseFloat(amount)) &&
                  parseFloat(amount) > 0
                    ? ` — GHS ${parseFloat(amount).toFixed(2)}`
                    : ""}
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Secured by Paystack · Your payment details are never stored on our
            servers
          </p>
        </div>
      </div>
    </div>
  );
}
