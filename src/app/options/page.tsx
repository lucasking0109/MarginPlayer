"use client";

import { useCallback } from "react";
import { Trash2, Target } from "lucide-react";
import { useOptions } from "@/hooks/use-options";
import { StatCard } from "@/components/stat-card";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { OptionForm } from "@/components/option-form";
import { PnlChart } from "@/components/pnl-chart";
import {
  calculateOptionsSummary,
  calculateLeverage,
  simulatePnl,
  getLeverageColor,
  daysToExpiration,
} from "@/lib/options";
import {
  formatUSD,
  formatMultiplier,
  formatDelta,
  formatPnl,
} from "@/lib/format";
import type { OptionPosition } from "@/lib/types";

export default function OptionsPage() {
  const {
    positions,
    loaded,
    addPosition,
    removePosition,
    importPositions,
    clearPositions,
  } = useOptions();

  const handleImport = useCallback(
    (
      extracted: Array<{
        symbol: string;
        optionType: "call" | "put";
        strike: number;
        expiration: string;
        premium: number;
        quantity: number;
        currentPrice: number;
        underlyingPrice: number;
      }>,
    ) => {
      importPositions(extracted);
    },
    [importPositions],
  );

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const summary = calculateOptionsSummary(positions);
  const pnlData = simulatePnl(positions);
  const currentPrice = positions.length > 0 ? positions[0].underlyingPrice : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Options</h2>
          <p className="text-sm text-gray-500 mt-1">
            Leverage, exposure & P&L simulation
          </p>
        </div>
        {positions.length > 0 && (
          <button
            onClick={clearPositions}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-red-400/30"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Notional Exposure"
            value={formatUSD(summary.totalNotional)}
          />
          <StatCard
            label="Net Delta"
            value={formatDelta(summary.netDelta)}
            subtext={`${summary.netDelta > 0 ? "Net long" : summary.netDelta < 0 ? "Net short" : "Neutral"}`}
          />
          <StatCard
            label="Premium Paid"
            value={formatUSD(summary.totalPremiumPaid)}
          />
          <StatCard
            label="Total P&L"
            value={formatPnl(summary.totalPnl)}
            color={summary.totalPnl >= 0 ? "#22c55e" : "#ef4444"}
          />
        </div>
      )}

      {/* Upload & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScreenshotUpload onPositionsExtracted={handleImport} />
        <OptionForm onSubmit={addPosition} />
      </div>

      {/* P&L Chart */}
      {positions.length > 0 && (
        <PnlChart data={pnlData} currentPrice={currentPrice} />
      )}

      {/* Positions Table */}
      {positions.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Positions ({positions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Symbol</th>
                  <th className="text-left px-3 py-3">Type</th>
                  <th className="text-right px-3 py-3">Strike</th>
                  <th className="text-right px-3 py-3">Exp</th>
                  <th className="text-right px-3 py-3">Qty</th>
                  <th className="text-right px-3 py-3">Premium</th>
                  <th className="text-right px-3 py-3">Current</th>
                  <th className="text-right px-3 py-3">Delta</th>
                  <th className="text-right px-3 py-3">Leverage</th>
                  <th className="text-right px-3 py-3">P&L</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <PositionRow
                    key={pos.id}
                    position={pos}
                    onRemove={removePosition}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {positions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-400">
            No options positions yet
          </h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md">
            Upload a screenshot from your broker or add positions manually to see
            leverage analysis and P&L simulation.
          </p>
        </div>
      )}
    </div>
  );
}

function PositionRow({
  position,
  onRemove,
}: {
  position: OptionPosition;
  onRemove: (id: string) => void;
}) {
  const leverage = calculateLeverage(position);
  const dte = daysToExpiration(position.expiration);
  const positionPnl =
    (position.currentPrice - position.premium) *
    position.quantity *
    100;

  return (
    <tr className="border-b border-border hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-3 font-medium text-white">
        {position.symbol}
      </td>
      <td className="px-3 py-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            position.optionType === "call"
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {position.optionType.toUpperCase()}
        </span>
      </td>
      <td className="px-3 py-3 text-right text-gray-300">
        ${position.strike.toFixed(2)}
      </td>
      <td className="px-3 py-3 text-right text-gray-300">
        <span className="text-gray-300">
          {position.expiration.slice(5)}
        </span>
        <span className="text-gray-600 text-xs ml-1">
          ({dte}d)
        </span>
      </td>
      <td className="px-3 py-3 text-right text-gray-300">
        {position.quantity > 0 ? "+" : ""}
        {position.quantity}
      </td>
      <td className="px-3 py-3 text-right text-gray-300">
        ${position.premium.toFixed(2)}
      </td>
      <td className="px-3 py-3 text-right text-gray-300">
        ${position.currentPrice.toFixed(2)}
      </td>
      <td className="px-3 py-3 text-right text-gray-300">
        {formatDelta(position.delta)}
      </td>
      <td className="px-3 py-3 text-right">
        <span
          className="font-medium"
          style={{ color: getLeverageColor(leverage.leverageRatio) }}
        >
          {formatMultiplier(leverage.leverageRatio)}
        </span>
      </td>
      <td
        className={`px-3 py-3 text-right font-medium ${
          positionPnl >= 0 ? "text-green-400" : "text-red-400"
        }`}
      >
        {formatPnl(positionPnl)}
      </td>
      <td className="px-3 py-3 text-right">
        <button
          onClick={() => onRemove(position.id)}
          className="text-gray-600 hover:text-red-400 transition-colors p-1"
          aria-label={`Remove ${position.symbol} position`}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
