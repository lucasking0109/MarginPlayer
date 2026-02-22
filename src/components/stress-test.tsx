"use client";

import { useState } from "react";
import type { Position, AccountInfo } from "@/lib/types";
import { simulateStress, HEALTH_COLORS, HEALTH_LABELS } from "@/lib/margin";
import { formatUSD } from "@/lib/format";

interface StressTestProps {
  positions: Position[];
  account: AccountInfo;
}

export function StressTest({ positions, account }: StressTestProps) {
  const [dropPercent, setDropPercent] = useState(10);

  const stressed = simulateStress(positions, account, dropPercent);

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        What-If Stress Test
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              If market drops by:
            </span>
            <span className="text-white font-bold">{dropPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={dropPercent}
            onChange={(e) => setDropPercent(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0%</span>
            <span>-25%</span>
            <span>-50%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-xs text-gray-500">Margin Usage</p>
            <p
              className="text-lg font-bold"
              style={{ color: HEALTH_COLORS[stressed.healthLevel] }}
            >
              {(stressed.marginUsageRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-xs text-gray-500">Status</p>
            <p
              className="text-lg font-bold"
              style={{ color: HEALTH_COLORS[stressed.healthLevel] }}
            >
              {HEALTH_LABELS[stressed.healthLevel]}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-xs text-gray-500">Equity</p>
            <p className="text-lg font-bold text-white">
              {formatUSD(stressed.totalEquity)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface">
            <p className="text-xs text-gray-500">Distance to MC</p>
            <p
              className={`text-lg font-bold ${stressed.distanceToMarginCall > 0 ? "text-profit" : "text-loss"}`}
            >
              {formatUSD(stressed.distanceToMarginCall)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
