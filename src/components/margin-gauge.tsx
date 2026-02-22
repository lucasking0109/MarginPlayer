"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { HealthLevel } from "@/lib/types";
import { HEALTH_COLORS, HEALTH_LABELS } from "@/lib/margin";

interface MarginGaugeProps {
  usageRate: number; // 0-1
  healthLevel: HealthLevel;
}

export function MarginGauge({ usageRate, healthLevel }: MarginGaugeProps) {
  const percentage = Math.min(usageRate * 100, 100);
  const color = HEALTH_COLORS[healthLevel];

  const data = [{ value: percentage, fill: color }];

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={data}
          barSize={12}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: "#2a2a3d" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">
          {percentage.toFixed(1)}%
        </span>
        <span
          className="text-xs font-semibold tracking-wider mt-1"
          style={{ color }}
        >
          {HEALTH_LABELS[healthLevel]}
        </span>
      </div>
    </div>
  );
}
