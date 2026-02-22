"use client";

import { useState } from "react";
import { useTrades } from "@/hooks/use-trades";
import { formatUSD, formatPnl } from "@/lib/format";
import { StatCard } from "@/components/stat-card";
import { Plus, Trash2 } from "lucide-react";

export default function TradingPage() {
  const { trades, loaded, addTrade, removeTrade, getSummary } = useTrades();
  const [showAdd, setShowAdd] = useState(false);
  const [pdtEnabled, setPdtEnabled] = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    symbol: "",
    side: "buy" as "buy" | "sell",
    quantity: "",
    price: "",
    fees: "0",
  });

  if (!loaded) return <p className="text-gray-500">Loading...</p>;

  const summary = getSummary();

  const handleAdd = () => {
    if (!form.symbol || !form.quantity || !form.price) return;
    addTrade({
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      quantity: Number(form.quantity),
      price: Number(form.price),
      fees: Number(form.fees),
    });
    setForm({
      ...form,
      symbol: "",
      quantity: "",
      price: "",
      fees: "0",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Day Trading</h1>
          <p className="text-sm text-gray-500">
            {trades.length} trades logged
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
        >
          <Plus size={14} />
          Add Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today P&L"
          value={formatPnl(summary.todayPnl)}
          color={summary.todayPnl >= 0 ? "#22c55e" : "#ef4444"}
        />
        <StatCard
          label="This Week"
          value={formatPnl(summary.weekPnl)}
          color={summary.weekPnl >= 0 ? "#22c55e" : "#ef4444"}
        />
        <StatCard
          label="This Month"
          value={formatPnl(summary.monthPnl)}
          color={summary.monthPnl >= 0 ? "#22c55e" : "#ef4444"}
        />
        <StatCard
          label="Win Rate"
          value={`${summary.winRate.toFixed(0)}%`}
          subtext={`${summary.totalTrades} completed trades`}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Win" value={formatUSD(summary.avgWin)} color="#22c55e" />
        <StatCard label="Avg Loss" value={formatUSD(Math.abs(summary.avgLoss))} color="#ef4444" />
        <StatCard label="Largest Win" value={formatUSD(summary.largestWin)} color="#22c55e" />
        <StatCard label="Largest Loss" value={formatUSD(Math.abs(summary.largestLoss))} color="#ef4444" />
      </div>

      {/* PDT Tracker */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Pattern Day Trader (PDT) Tracker
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              4 day trades in 5 business days triggers PDT flag ($25k minimum equity required)
            </p>
          </div>
          <button
            onClick={() => setPdtEnabled(!pdtEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              pdtEnabled
                ? "bg-blue-600/20 text-blue-400"
                : "bg-gray-700 text-gray-500"
            }`}
          >
            {pdtEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {pdtEnabled && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i < summary.dayTradesLast5Days
                      ? summary.dayTradesLast5Days >= 3
                        ? "bg-loss/20 text-loss"
                        : "bg-warning/20 text-warning"
                      : "bg-surface text-gray-600"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-400">
              {summary.dayTradesLast5Days}/3 day trades used
              {summary.dayTradesLast5Days >= 3 && (
                <span className="text-loss font-medium ml-2">
                  ⚠ Next trade triggers PDT!
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Add Trade Form */}
      {showAdd && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Log Trade
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            />
            <select
              value={form.side}
              onChange={(e) => setForm({ ...form, side: e.target.value as "buy" | "sell" })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <input
              placeholder="Symbol"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm uppercase"
            />
            <input
              placeholder="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            />
            <input
              placeholder="Price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            />
            <input
              placeholder="Fees"
              type="number"
              step="0.01"
              value={form.fees}
              onChange={(e) => setForm({ ...form, fees: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            >
              Log
            </button>
          </div>
        </div>
      )}

      {/* Trades Table */}
      {trades.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Side</th>
                  <th className="text-left p-4">Symbol</th>
                  <th className="text-right p-4">Qty</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Fees</th>
                  <th className="text-right p-4"></th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 50).map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/50 hover:bg-card-hover transition-colors"
                  >
                    <td className="p-4 text-gray-400">{t.date}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          t.side === "buy"
                            ? "bg-profit/20 text-profit"
                            : "bg-loss/20 text-loss"
                        }`}
                      >
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-white">{t.symbol}</td>
                    <td className="p-4 text-right text-gray-300">{t.quantity}</td>
                    <td className="p-4 text-right text-gray-300">${t.price.toFixed(2)}</td>
                    <td className="p-4 text-right text-white">
                      {formatUSD(t.quantity * t.price)}
                    </td>
                    <td className="p-4 text-right text-gray-500">${t.fees.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeTrade(t.id)}
                        className="text-gray-600 hover:text-loss transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
