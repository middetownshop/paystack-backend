import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { getBundlePrice, hasAgentPricing, formatGHS } from "@/lib/pricing";
import type { UserProfile } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Zap,
  Search,
  Wallet,
  Wifi,
  Clock,
  Phone,
  X,
  CheckCircle2,
  Sparkles,
  CreditCard,
} from "lucide-react";

const NETWORKS = [
  "All",
  "MTN",
  "Telecel",
  "AirtelTigo",
] as const;

const NETWORK_CONFIG: Record<
  string,
  {
    bg: string;
    text: string;
    logo: string;
    prefixes: string[];
  }
> = {
  MTN: {
    bg: "#EAB308",
    text: "#fff",
    logo: "🟡",
    prefixes: ["024", "054", "055", "059"],
  },

  Telecel: {
    bg: "#EF4444",
    text: "#fff",
    logo: "🔴",
    prefixes: ["020", "050"],
  },

  AirtelTigo: {
    bg: "#3B82F6",
    text: "#fff",
    logo: "🔵",
    prefixes: ["026", "027", "056", "057"],
  },
};

function PhoneModal({
  bundle,
  balance,
  profile,
  onConfirm,
  onClose,
  loading,
}: {
  bundle: any;
  balance: number;
  profile: UserProfile | null;
  onConfirm: (
    phone: string,
    paymentMethod: "wallet" | "paystack"
  ) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [phone, setPhone] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<"wallet" | "paystack">("paystack");

  const cfg =
    NETWORK_CONFIG[bundle.network] || NETWORK_CONFIG["MTN"];

  const isValid = /^0\d{9}$/.test(phone);

  const basePrice = Number(bundle.price || 0);
  const finalPrice = getBundlePrice(bundle, profile);
  const isAgentPricing = hasAgentPricing(bundle, profile);

  const canUseWallet = balance >= finalPrice;

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (isValid) {
      onConfirm(phone, paymentMethod);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl">
        {/* Top Gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{
            background: `linear-gradient(to right, white, ${cfg.bg}, white)`,
          }}
        />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${cfg.bg}20`,
                  color: cfg.bg,
                }}
              >
                <Zap className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-black text-xl text-foreground">
                  Checkout
                </h3>

                <p className="text-xs text-muted-foreground">
                  Complete your purchase
                </p>
              </div>
            </div>

            {!loading && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Bundle Preview */}
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: `${cfg.bg}40`,
              backgroundColor: `${cfg.bg}10`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  className="mb-2 border-0"
                  style={{
                    backgroundColor: cfg.bg,
                    color: "#fff",
                  }}
                >
                  {cfg.logo} {bundle.network}
                </Badge>

                <h2 className="text-3xl font-black text-foreground">
                  {bundle.size}
                </h2>

                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <Clock className="h-3 w-3" />
                  {bundle.validity}
                </p>
              </div>

              <div className="text-right">
                {isAgentPricing ? (
                  <>
                    <p className="text-3xl font-black text-foreground">
                      GHS {formatGHS(finalPrice)}
                    </p>
                    <p className="text-sm line-through text-muted-foreground">
                      GHS {formatGHS(basePrice)}
                    </p>
                    <p className="text-[11px] font-bold text-green-600 mt-0.5">
                      Agent price
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-black text-foreground">
                    GHS {formatGHS(basePrice)}
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  Wallet: GHS {formatGHS(balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <Label className="text-foreground">
              Select Payment Method
            </Label>

            <div className="grid grid-cols-2 gap-3">
              {/* Paystack */}
              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "paystack"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition-all ${
                  paymentMethod ===
                  "paystack"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <CreditCard className="h-5 w-5 mb-2 text-primary" />

                <p className="font-bold text-foreground">
                  Paystack
                </p>

                <p className="text-xs text-muted-foreground">
                  Card / MOMO
                </p>
              </button>

              {/* Wallet */}
              <button
                type="button"
                disabled={!canUseWallet}
                onClick={() =>
                  setPaymentMethod(
                    "wallet"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition-all ${
                  paymentMethod ===
                  "wallet"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                } ${
                  !canUseWallet
                    ? "opacity-50"
                    : ""
                }`}
              >
                <Wallet className="h-5 w-5 mb-2 text-primary" />

                <p className="font-bold text-foreground">
                  Wallet
                </p>

                <p className="text-xs text-muted-foreground">
                  Use balance
                </p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-foreground"
              >
                Recipient Number
              </Label>

              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0257869403"
                  value={phone}
                  disabled={loading}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  className="h-12 rounded-2xl pr-10 font-mono text-lg"
                />

                {isValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>

              {/* Prefixes */}
              <div className="flex flex-wrap gap-2">
                {cfg.prefixes.map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      setPhone(prefix)
                    }
                    className="rounded-full border px-3 py-1 text-xs font-semibold hover:opacity-80"
                    style={{
                      borderColor: `${cfg.bg}40`,
                      color: cfg.bg,
                    }}
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="h-12 w-full rounded-2xl text-base font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.bg}CC)`,
              }}
            >
              {loading ? (
                "Processing..."
              ) : paymentMethod ===
                "paystack" ? (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Continue to Paystack
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Pay with Wallet
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function QuickSell() {
  const { user, profile } = useAuth();

  const { toast } = useToast();

  const [bundles, setBundles] = useState<
    any[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [activeNetwork, setActiveNetwork] =
    useState("All");

  const [selectedBundle, setSelectedBundle] =
    useState<any | null>(null);

  const [buying, setBuying] =
    useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "bundles"),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        data.sort(
          (a: any, b: any) =>
            (a.price || 0) -
            (b.price || 0)
        );

        setBundles(data);

        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const handleBuy = async (
    phone: string,
    paymentMethod: "wallet" | "paystack"
  ) => {
    if (!selectedBundle) return;

    const finalPrice = getBundlePrice(selectedBundle, profile);

    // ================= PAYSTACK =================
    if (paymentMethod === "paystack") {
      try {
        setBuying(true);

        // Use profile.email (Firestore string, always set) with fallback to Firebase User email
        const email = profile?.email ?? user?.email;
        console.log("[QuickSell] Starting Paystack init", { email, finalPrice, bundleId: selectedBundle.id });

        if (!email) {
          throw new Error("User email not available. Please try again.");
        }
        if (!user?.uid) {
          throw new Error("User not authenticated. Please log in again.");
        }

        const callbackUrl =
          window.location.origin +
          (import.meta.env.BASE_URL || "/").replace(/\/$/, "") +
          "/dashboard/deposit";

        const requestBody = {
          email,
          // finalPrice is already in GHS — backend converts to pesewas (×100)
          amount: finalPrice,
          callback_url: callbackUrl,
          metadata: {
            userId: user.uid,
            bundleId: selectedBundle.id,
            phone,
            network: selectedBundle.network,
            size: selectedBundle.size,
            paymentType: "bundle_purchase",
          },
        };

        console.log("[QuickSell] Sending to /api/paystack/initialize:", requestBody);

        const response = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        console.log("[QuickSell] Response status:", response.status);

        const text = await response.text();
        console.log("[QuickSell] Raw response body:", text);

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("[QuickSell] JSON parse failed. Raw text was:", JSON.stringify(text));
          throw new Error(
            `Server returned non-JSON response (status ${response.status}). Check API server logs.`
          );
        }

        console.log("[QuickSell] Parsed response:", data);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Paystack initialization failed");
        }

        if (!data?.data?.authorization_url) {
          throw new Error("No authorization_url in Paystack response");
        }

        console.log("[QuickSell] Redirecting to Paystack:", data.data.authorization_url);

        // Redirect to Paystack hosted payment page
        window.location.href = data.data.authorization_url;
        return;
      } catch (err: any) {
        console.error("[QuickSell] Paystack error:", err);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: err?.message || "Could not connect to Paystack",
        });
      } finally {
        setBuying(false);
      }

      return;
    }

    // WALLET
    if (!user || !profile) return;

    const balance =
      profile.walletBalance ?? 0;

    if (balance < finalPrice) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
      });

      return;
    }

    setBuying(true);

    try {
      await runTransaction(
        db,
        async (tx) => {
          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userDoc =
            await tx.get(userRef);

          if (!userDoc.exists()) {
            throw new Error(
              "User not found"
            );
          }

          const currentBalance =
            userDoc.data()
              .walletBalance || 0;

          if (
            currentBalance < finalPrice
          ) {
            throw new Error(
              "Insufficient balance"
            );
          }

          tx.update(userRef, {
            walletBalance:
              currentBalance -
              finalPrice,
          });
        }
      );

      await addDoc(
        collection(db,"orders"),
        {
          uid: user.uid,
          userName: profile.name,

          bundleId: selectedBundle.id,

          network:
            selectedBundle.network,

          size: selectedBundle.size,

          validity:
            selectedBundle.validity,

          originalPrice: selectedBundle.price,

          amountPaid: finalPrice,

          price: finalPrice,

          recipientPhone: phone,

          flashSale:
            selectedBundle.flashSale ||
            false,

          paymentMethod:
            paymentMethod,

          status: "completed",

          timestamp:
            serverTimestamp(),
        }
      );
      const ref = `WAL-${Date.now()}`;

      window.location.href =
        `/dashboard/deposit?walletSuccess=true` +
        `&network=${encodeURIComponent(selectedBundle.network)}` +
        `&size=${encodeURIComponent(selectedBundle.size)}` +
        `&phone=${encodeURIComponent(phone)}` +
        `&amount=${finalPrice}` +
        `&reference=${ref}`;
     
    } catch (err: any) {
      toast({
        variant: "destructive",

        title: "Purchase Failed",

        description: err.message,
      });
    } finally {
      setBuying(false);
    }
  };

  const filtered = bundles
    .filter(
      (bundle) =>
        activeNetwork === "All" ||
        bundle.network ===
          activeNetwork
    )
    .filter(
      (bundle) =>
        !search ||
        bundle.network
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        bundle.size
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>

            <div>
              <h1 className="text-3xl font-black text-foreground">
                Quick Sell
              </h1>

              <p className="text-muted-foreground text-sm">
                Buy data bundles instantly
              </p>
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Wallet Balance
                </p>

                <h3 className="text-2xl font-black text-foreground">
                  GHS{" "}
                  {profile?.walletBalance?.toFixed(
                    2
                  ) ?? "0.00"}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search bundles..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="pl-11 h-12 rounded-2xl bg-background"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((network) => {
              const cfg =
                network !== "All"
                  ? NETWORK_CONFIG[
                      network
                    ]
                  : null;

              const active =
                activeNetwork ===
                network;

              return (
                <button
                  key={network}
                  onClick={() =>
                    setActiveNetwork(
                      network
                    )
                  }
                  className={`rounded-2xl px-4 py-2 text-sm font-bold border transition-all ${
                    active
                      ? "scale-105 shadow-lg"
                      : "hover:scale-105 bg-card"
                  }`}
                  style={
                    active && cfg
                      ? {
                          backgroundColor:
                            cfg.bg,

                          borderColor:
                            cfg.bg,

                          color: "#fff",
                        }
                      : {}
                  }
                >
                  {cfg
                    ? `${cfg.logo} ${network}`
                    : "All"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map(
              (_, i) => (
                <Skeleton
                  key={i}
                  className="h-64 rounded-3xl"
                />
              )
            )}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          filtered.length === 0 && (
            <Card className="rounded-3xl">
              <CardContent className="py-20 flex flex-col items-center gap-4">
                <Wifi className="h-14 w-14 text-gray-300" />

                <div className="text-center">
                  <h3 className="font-bold text-lg text-foreground">
                    No Bundles Found
                  </h3>

                  <p className="text-muted-foreground text-sm">
                    Try another keyword
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Bundle Cards */}
        {!loading &&
          filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((bundle) => {
                const cfg =
                  NETWORK_CONFIG[bundle.network] || NETWORK_CONFIG["MTN"];

                const basePrice = Number(bundle.price || 0);
                const discountedPrice = getBundlePrice(bundle, profile);
                const isAgentPriced = hasAgentPricing(bundle, profile);

                return (
                  <div
                    key={bundle.id}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Glow */}
                    <div
                      className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20"
                      style={{
                        backgroundColor:
                          cfg.bg,
                      }}
                    />

                    {/* Top Gradient */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{
                        background: `linear-gradient(to right, white, ${cfg.bg}, white)`,
                      }}
                    />

                    {/* Flash Sale */}
                    {bundle.flashSale && (
                      <div className="absolute top-3 right-3 z-20">
                        <div className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-black text-white shadow-lg animate-pulse">
                          ⚡ FLASH SALE
                        </div>
                      </div>
                    )}

                    {/* Agent price badge */}
                    {isAgentPriced && (
                      <div className="absolute top-3 left-3 z-20">
                        <div className="rounded-full bg-green-500 px-3 py-1 text-[10px] font-black text-white shadow-lg">
                          Agent Price
                        </div>
                      </div>
                    )}

                    <div className="relative p-4 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between mt-5 mb-4">
                        <div
                          className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${cfg.bg}, white)`,
                          }}
                        >
                          {cfg.logo}
                        </div>

                        <Badge
                          className="border-0 rounded-full text-[11px] font-bold shadow-sm"
                          style={{
                            backgroundColor: `${cfg.bg}20`,
                            color: cfg.bg,
                          }}
                        >
                          {
                            bundle.network
                          }
                        </Badge>
                      </div>

                      {/* Size */}
                      <div className="space-y-1 mb-3">
                        <h2 className="text-3xl font-black leading-none text-foreground">
                          {bundle.size}
                        </h2>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {
                            bundle.validity
                          }
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        {isAgentPriced ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-foreground">
                                GHS {formatGHS(discountedPrice)}
                              </span>
                              <span className="text-sm line-through text-muted-foreground">
                                GHS {formatGHS(basePrice)}
                              </span>
                            </div>
                            <p className="text-[11px] text-green-600 font-bold">
                              Save GHS {formatGHS(basePrice - discountedPrice)}
                            </p>
                          </>
                        ) : (
                          <span className="text-3xl font-black text-foreground">
                            GHS {formatGHS(basePrice)}
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Secure Checkout
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          Instant Delivery
                        </div>
                      </div>

                      {/* Buy Button */}
                      <Button
                        onClick={() =>
                          setSelectedBundle(
                            bundle
                          )
                        }
                        className="mt-auto h-11 rounded-2xl text-sm font-bold text-white shadow-lg hover:scale-[1.02] transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.bg}CC)`,
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Modal */}
      {selectedBundle && (
        <PhoneModal
          bundle={selectedBundle}
          balance={profile?.walletBalance ?? 0}
          profile={profile}
          onConfirm={handleBuy}
          onClose={() => !buying && setSelectedBundle(null)}
          loading={buying}
        />
      )}
    </>
  );
}