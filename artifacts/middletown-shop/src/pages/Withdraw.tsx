import { ArrowUpFromLine } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";

export default function Withdraw() {
  const { profile } = useAuth();

  // SHOW PROFIT ONLY
  const profitBalance = profile?.profitBalance ?? 0;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Withdraw Funds
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Withdraw your earned profit.
        </p>
      </div>

      {/* PROFIT BALANCE */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">
            Available Profit
          </p>

          <p className="text-3xl font-bold text-green-600">
            GHS {profitBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <ArrowUpFromLine className="w-7 h-7 text-green-600" />
      </div>

      {/* INFO */}
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
        <h2 className="font-semibold text-blue-800 mb-2">
          Profit Withdrawals
        </h2>

        <p className="text-sm text-blue-700">
          Only profits earned from bundle sales can be withdrawn.
        </p>

        <p className="text-sm text-blue-700 mt-2">
          Customer deposits and wallet balances are not included in this amount.
        </p>
      </div>

      {/* DISABLED UNTIL YOU BUILD WITHDRAWALS */}
      <button
        disabled
        className="w-full py-3 rounded-lg bg-gray-300 text-gray-600 font-semibold cursor-not-allowed"
      >
        Withdrawals Unavailable
      </button>

      <p className="text-xs text-center text-gray-400">
        Withdrawal functionality will be enabled in a future update.
      </p>
    </div>
  );
}