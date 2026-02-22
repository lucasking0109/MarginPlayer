"use client";

import { useState } from "react";
import type { PositionAnalysis } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/format";

interface LiquidationPanelProps {
  analyses: PositionAnalysis[];
  currentMarginRate: number;
}

export function LiquidationPanel({
  analyses,
  currentMarginRate,
}: LiquidationPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (symbol: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  // Calculate projected margin rate if selected positions are sold
  const totalFreed = analyses
    .filter((a) => selected.has(a.symbol))
    .reduce((sum, a) => sum + a.marginFreedIfSold, 0);
  const projectedRate = Math.max(0, currentMarginRate - totalFreed);

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-sm font-semibold text-danger uppercase tracking-wider mb-4">
        Liquidation Suggestions
      </h3>

      <div className="space-y-2">
        {analyses.slice(0, 8).map((a) => (
          <label
            key={a.symbol}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card-hover cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(a.symbol)}
              onChange={() => toggle(a.symbol)}
              className="w-4 h-4 rounded accent-danger"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm">
                  {a.symbol}
                </span>
                <span
                  className={`text-sm font-medium ${a.pnl >= 0 ? "text-profit" : "text-loss"}`}
                >
                  {formatPercent(a.pnlPercent)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatUSD(a.marketValue)}</span>
                <span>
                  Frees {(a.marginFreedIfSold * 100).toFixed(1)}% margin
                </span>
              </div>
            </div>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-surface border border-border">
          <p className="text-xs text-gray-400">
            If you sell {selected.size} position{selected.size > 1 ? "s" : ""}:
          </p>
          <p className="text-lg font-bold text-white mt-1">
            Margin Usage → {(projectedRate * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}
