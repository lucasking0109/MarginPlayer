"use client";

import { usePositions } from "@/hooks/use-positions";
import { useAccount } from "@/hooks/use-account";
import { useTrades } from "@/hooks/use-trades";
import { useStockPrices } from "@/hooks/use-stock-prices";
import {
  calculateMarginStatus,
  analyzePositions,
  HEALTH_COLORS,
} from "@/lib/margin";
import { formatUSD, formatPnl } from "@/lib/format";
import { MarginGauge } from "@/components/margin-gauge";
import { StatCard } from "@/components/stat-card";
import { LiquidationPanel } from "@/components/liquidation-panel";
import { StressTest } from "@/components/stress-test";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { positions, loaded: posLoaded, updatePrices } = usePositions();
  const { account, loaded: accLoaded } = useAccount();
  const { getSummary } = useTrades();
  const { fetchPrices, loading: priceLoading, lastUpdated, error: priceError, lastResult } = useStockPrices();

  if (!posLoaded || !accLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const status = calculateMarginStatus(positions, account);
  const analyses = analyzePositions(positions, account);
  const tradeSummary = getSummary();
  const showLiquidation =
    status.healthLevel === "warning" ||
    status.healthLevel === "danger" ||
    status.healthLevel === "margin-call";

  const handleRefreshPrices = async () => {
    const symbols = positions.map((p) => p.symbol);
    const prices = await fetchPrices(symbols);
    if (Object.keys(prices).length > 0) {
      updatePrices(prices);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {positions.length} positions · TD/Schwab Reg-T
          </p>
        </div>
        <button
          onClick={handleRefreshPrices}
          disabled={priceLoading || positions.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card hover:bg-card-hover border border-border text-sm text-gray-300 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={priceLoading ? "animate-spin" : ""} />
          {priceLoading ? "Refreshing..." : "Refresh Prices"}
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {priceError && (
        <div className="p-3 rounded-lg bg-loss/10 border border-loss/30 text-sm text-loss">
          Price fetch failed: {priceError}
        </div>
      )}
      {lastResult && !priceError && (
        <div className="p-3 rounded-lg bg-profit/10 border border-profit/30 text-sm text-profit">
          {lastResult}
        </div>
      )}

      {positions.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border text-center">
          <p className="text-gray-400 text-lg mb-2">No positions yet</p>
          <p className="text-gray-600 text-sm">
            Go to <span className="text-white font-medium">Portfolio</span> to
            add positions or upload a Schwab CSV.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                Margin Usage
              </p>
              <MarginGauge
                usageRate={status.marginUsageRate}
                healthLevel={status.healthLevel}
              />
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <StatCard label="Total Equity" value={formatUSD(status.totalEquity)} />
              <StatCard label="Margin Loan" value={formatUSD(account.marginLoan)} color="#f59e0b" />
              <StatCard label="Buying Power" value={formatUSD(status.buyingPower)} />
              <StatCard
                label="Distance to Margin Call"
                value={formatUSD(status.distanceToMarginCall)}
                color={HEALTH_COLORS[status.healthLevel]}
                subtext={status.distanceToMarginCall > 0 ? "Buffer remaining" : "MARGIN CALL TRIGGERED"}
              />
            </div>
          </div>

          {status.concentratedPositions.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <AlertTriangle size={18} className="text-warning flex-shrink-0" />
              <p className="text-sm text-warning">
                <strong>Concentrated positions:</strong>{" "}
                {status.concentratedPositions.join(", ")} exceed 30% of your
                account. Schwab may require higher margin (40-100%).
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {showLiquidation ? (
              <LiquidationPanel analyses={analyses} currentMarginRate={status.marginUsageRate} />
            ) : (
              <div className="bg-card rounded-xl p-6 border border-border flex items-center justify-center">
                <p className="text-gray-600 text-sm">
                  Liquidation suggestions appear when margin is at WARNING or higher.
                </p>
              </div>
            )}
            <StressTest positions={positions} account={account} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Day Trading Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Today P&L" value={formatPnl(tradeSummary.todayPnl)} color={tradeSummary.todayPnl >= 0 ? "#22c55e" : "#ef4444"} />
              <StatCard label="This Week" value={formatPnl(tradeSummary.weekPnl)} color={tradeSummary.weekPnl >= 0 ? "#22c55e" : "#ef4444"} />
              <StatCard label="Win Rate" value={`${tradeSummary.winRate.toFixed(0)}%`} subtext={`${tradeSummary.totalTrades} trades`} />
              <StatCard label="PDT Counter" value={`${tradeSummary.dayTradesLast5Days}/3`} color={tradeSummary.dayTradesLast5Days >= 3 ? "#ef4444" : "#22c55e"} subtext="Day trades in 5 days" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
