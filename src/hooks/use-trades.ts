"use client";

import { useCallback } from "react";
import type { Trade, DayTradeSummary } from "@/lib/types";
import { useLocalStorage } from "./use-local-storage";

export function useTrades() {
  const [trades, setTrades, loaded] = useLocalStorage<Trade[]>(
    "mp-trades",
    [],
  );

  const addTrade = useCallback(
    (trade: Omit<Trade, "id">) => {
      setTrades((prev) => [
        { ...trade, id: crypto.randomUUID() },
        ...prev,
      ]);
    },
    [setTrades],
  );

  const removeTrade = useCallback(
    (id: string) => {
      setTrades((prev) => prev.filter((t) => t.id !== id));
    },
    [setTrades],
  );

  const getSummary = useCallback((): DayTradeSummary => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Calculate P&L by pairing buy/sell trades for same symbol on same day
    const pnlByDate = new Map<string, number>();
    const tradesByDateSymbol = new Map<string, Trade[]>();

    for (const t of trades) {
      const key = `${t.date}:${t.symbol}`;
      if (!tradesByDateSymbol.has(key)) tradesByDateSymbol.set(key, []);
      tradesByDateSymbol.get(key)!.push(t);
    }

    const completedTrades: { date: string; pnl: number }[] = [];

    for (const [, group] of tradesByDateSymbol) {
      const buys = group.filter((t) => t.side === "buy");
      const sells = group.filter((t) => t.side === "sell");

      if (buys.length > 0 && sells.length > 0) {
        const totalBuyCost = buys.reduce(
          (sum, t) => sum + t.quantity * t.price + t.fees,
          0,
        );
        const totalSellRevenue = sells.reduce(
          (sum, t) => sum + t.quantity * t.price - t.fees,
          0,
        );
        const pnl = totalSellRevenue - totalBuyCost;
        const date = group[0].date;
        completedTrades.push({ date, pnl });

        pnlByDate.set(date, (pnlByDate.get(date) || 0) + pnl);
      }
    }

    const todayPnl = pnlByDate.get(today) || 0;
    const weekPnl = completedTrades
      .filter((t) => new Date(t.date) >= weekAgo)
      .reduce((sum, t) => sum + t.pnl, 0);
    const monthPnl = completedTrades
      .filter((t) => new Date(t.date) >= monthAgo)
      .reduce((sum, t) => sum + t.pnl, 0);

    const wins = completedTrades.filter((t) => t.pnl > 0);
    const losses = completedTrades.filter((t) => t.pnl < 0);

    // Day trades in last 5 business days (for PDT tracking)
    const fiveBusinessDaysAgo = new Date(now);
    let daysBack = 0;
    let businessDays = 0;
    while (businessDays < 5) {
      daysBack++;
      const d = new Date(now);
      d.setDate(d.getDate() - daysBack);
      const day = d.getDay();
      if (day !== 0 && day !== 6) businessDays++;
    }
    fiveBusinessDaysAgo.setDate(fiveBusinessDaysAgo.getDate() - daysBack);

    const recentDayTrades = completedTrades.filter(
      (t) => new Date(t.date) >= fiveBusinessDaysAgo,
    ).length;

    return {
      todayPnl,
      weekPnl,
      monthPnl,
      totalTrades: completedTrades.length,
      winRate:
        completedTrades.length > 0
          ? (wins.length / completedTrades.length) * 100
          : 0,
      avgWin:
        wins.length > 0
          ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length
          : 0,
      avgLoss:
        losses.length > 0
          ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length
          : 0,
      largestWin:
        wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0,
      largestLoss:
        losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0,
      dayTradesLast5Days: recentDayTrades,
    };
  }, [trades]);

  return { trades, loaded, addTrade, removeTrade, getSummary };
}
