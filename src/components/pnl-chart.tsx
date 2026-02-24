"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { PnlDataPoint } from "@/lib/types";
import { formatUSD } from "@/lib/format";

interface PnlChartProps {
  data: PnlDataPoint[];
  currentPrice: number;
}

export function PnlChart({ data, currentPrice }: PnlChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">
          Add positions to see P&L simulation
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        P&L at Expiration
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
            <XAxis
              dataKey="underlyingPrice"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              stroke="#2a2a3d"
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v: number) => formatUSD(v)}
              stroke="#2a2a3d"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e1e2e",
                border: "1px solid #2a2a3d",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelFormatter={(v) => `Stock: $${Number(v).toFixed(2)}`}
              formatter={(value) => [formatUSD(Number(value)), "P&L"]}
            />
            <ReferenceLine
              y={0}
              stroke="#6b7280"
              strokeDasharray="4 4"
              label={{
                value: "Break Even",
                position: "right",
                fill: "#6b7280",
                fontSize: 10,
              }}
            />
            <ReferenceLine
              x={currentPrice}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: "Current",
                position: "top",
                fill: "#f59e0b",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
