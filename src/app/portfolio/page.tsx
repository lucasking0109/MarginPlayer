"use client";

import { useState, useRef } from "react";
import { usePositions } from "@/hooks/use-positions";
import { useAccount } from "@/hooks/use-account";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { parseSchwabCSV } from "@/lib/csv-parser";
import { formatUSD, formatPercent } from "@/lib/format";
import { calculateMarginStatus } from "@/lib/margin";
import {
  Plus,
  Upload,
  RefreshCw,
  Trash2,
  Settings,
  AlertTriangle,
} from "lucide-react";

export default function PortfolioPage() {
  const {
    positions,
    loaded,
    addPosition,
    removePosition,
    updatePrices,
    importPositions,
  } = usePositions();
  const { account, setAccount } = useAccount();
  const { fetchPrices, loading: priceLoading } = useStockPrices();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    quantity: "",
    avgCost: "",
    currentPrice: "",
    marginRate: "0.30",
  });

  if (!loaded) return <p className="text-gray-500">Loading...</p>;

  const status = calculateMarginStatus(positions, account);

  const handleAdd = () => {
    if (!form.symbol || !form.quantity || !form.avgCost) return;
    addPosition({
      symbol: form.symbol.toUpperCase(),
      quantity: Number(form.quantity),
      avgCost: Number(form.avgCost),
      currentPrice: Number(form.currentPrice) || Number(form.avgCost),
      marginRate: Number(form.marginRate),
    });
    setForm({ symbol: "", quantity: "", avgCost: "", currentPrice: "", marginRate: "0.30" });
    setShowAdd(false);
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseSchwabCSV(text);
      if (parsed.length > 0) {
        importPositions(parsed);
        alert(`Imported ${parsed.length} positions`);
      } else {
        alert("No valid positions found in CSV");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRefresh = async () => {
    const symbols = positions.map((p) => p.symbol);
    const prices = await fetchPrices(symbols);
    if (Object.keys(prices).length > 0) updatePrices(prices);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-sm text-gray-500">
            {positions.length} positions · Market Value{" "}
            {formatUSD(status.totalMarketValue)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-card-hover border border-border text-sm text-gray-300 transition-colors"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={handleRefresh}
            disabled={priceLoading || positions.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-card-hover border border-border text-sm text-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={priceLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-card-hover border border-border text-sm text-gray-300 transition-colors"
          >
            <Upload size={14} />
            CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Account Settings */}
      {showSettings && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Account Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cash Balance ($)</label>
              <input
                type="number"
                value={account.cashBalance}
                onChange={(e) => setAccount({ ...account, cashBalance: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Margin Loan ($)</label>
              <input
                type="number"
                value={account.marginLoan}
                onChange={(e) => setAccount({ ...account, marginLoan: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Position Form */}
      {showAdd && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Add Position
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
              placeholder="Avg Cost"
              type="number"
              step="0.01"
              value={form.avgCost}
              onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            />
            <input
              placeholder="Current Price"
              type="number"
              step="0.01"
              value={form.currentPrice}
              onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-white text-sm"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Margin Rate:</label>
            <select
              value={form.marginRate}
              onChange={(e) => setForm({ ...form, marginRate: e.target.value })}
              className="px-2 py-1 rounded bg-surface border border-border text-white text-xs"
            >
              <option value="0.25">25% (FINRA min)</option>
              <option value="0.30">30% (Schwab default)</option>
              <option value="0.40">40%</option>
              <option value="0.50">50%</option>
              <option value="0.75">75%</option>
              <option value="1.00">100% (non-marginable)</option>
            </select>
          </div>
        </div>
      )}

      {/* Positions Table */}
      {positions.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left p-4">Symbol</th>
                  <th className="text-right p-4">Qty</th>
                  <th className="text-right p-4">Avg Cost</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Market Value</th>
                  <th className="text-right p-4">P&L</th>
                  <th className="text-right p-4">P&L %</th>
                  <th className="text-right p-4">Weight</th>
                  <th className="text-right p-4">Margin</th>
                  <th className="text-right p-4"></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const mv = p.quantity * p.currentPrice;
                  const cost = p.quantity * p.avgCost;
                  const pnl = mv - cost;
                  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                  const weight =
                    status.totalMarketValue > 0
                      ? (mv / status.totalMarketValue) * 100
                      : 0;
                  const isConcentrated = weight > 30;

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-card-hover transition-colors"
                    >
                      <td className="p-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          {p.symbol}
                          {isConcentrated && (
                            <AlertTriangle size={12} className="text-warning" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-300">{p.quantity}</td>
                      <td className="p-4 text-right text-gray-300">${p.avgCost.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">${p.currentPrice.toFixed(2)}</td>
                      <td className="p-4 text-right text-white">{formatUSD(mv)}</td>
                      <td className={`p-4 text-right font-medium ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatUSD(pnl)}
                      </td>
                      <td className={`p-4 text-right font-medium ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatPercent(pnlPct)}
                      </td>
                      <td className={`p-4 text-right ${isConcentrated ? "text-warning font-medium" : "text-gray-400"}`}>
                        {weight.toFixed(1)}%
                      </td>
                      <td className="p-4 text-right text-gray-500">{(p.marginRate * 100).toFixed(0)}%</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => removePosition(p.id)}
                          className="text-gray-600 hover:text-loss transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
