import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  CreditCard,
} from "lucide-react";

/* ---------------- CURRENCY CONFIG ---------------- */

const CURRENCY = {
  code: "GHS",
  symbol: "₵",
  name: "Ghana Cedi",
};

function formatCurrency(value: number) {
  return `${CURRENCY.symbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ---------------- ACTION CARD ---------------- */

function ActionCard({
  icon: Icon,
  label,
  description,
  href,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-4 p-5 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow ${
          primary ? "bg-primary border-primary/20" : "bg-card border-card-border"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            primary ? "bg-white/20" : "bg-muted"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              primary ? "text-primary-foreground" : "text-foreground"
            }`}
          />
        </div>

        <div>
          <p
            className={`font-semibold text-sm ${
              primary ? "text-primary-foreground" : "text-foreground"
            }`}
          >
            {label}
          </p>

          <p
            className={`text-xs mt-0.5 ${
              primary
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ---------------- WALLET ---------------- */

export default function Wallet() {
  const { profile } = useAuth();

  const balance = profile?.walletBalance ?? 0;

  return (
    <div className="max-w-lg mx-auto">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Wallet
      </h1>

      {/* BALANCE CARD */}
      <div className="bg-sidebar rounded-2xl p-7 mb-6 text-center">
        <div className="w-14 h-14 rounded-full bg-sidebar-primary/20 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-7 h-7 text-sidebar-primary" />
        </div>

        <p className="text-sidebar-foreground/60 text-sm mb-1">
          Available Balance
        </p>

        <p className="text-4xl font-bold text-sidebar-foreground">
          {formatCurrency(balance)}
        </p>

        <p className="text-sidebar-foreground/40 text-xs mt-2">
          MiddletownShop Wallet
        </p>
      </div>

      {/* ACTIONS */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Actions
        </h2>

        <ActionCard
          icon={ArrowDownToLine}
          label="Fund Wallet"
          description="Add money via Paystack"
          href="/dashboard/deposit"
          primary
        />

        <ActionCard
          icon={ArrowUpFromLine}
          label="Withdraw Funds"
          description="Withdraw to your bank account"
          href="/dashboard/withdraw"
        />

        <ActionCard
          icon={Receipt}
          label="Transaction History"
          description="View all past transactions"
          href="/dashboard/transactions"
        />
      </div>

      {/* INFO */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-semibold text-sm text-foreground mb-3">
          Wallet Info
        </h3>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Name</span>
            <span className="font-medium text-foreground">
              {profile?.name || "—"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Type</span>
            <span className="font-medium text-foreground capitalize">
              {profile?.role || "user"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Currency</span>
            <span className="font-medium text-foreground">
              {CURRENCY.name} ({CURRENCY.symbol})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}