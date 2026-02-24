"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";

interface OptionFormProps {
  onSubmit: (position: {
    symbol: string;
    optionType: "call" | "put";
    strike: number;
    expiration: string;
    premium: number;
    quantity: number;
    currentPrice: number;
    underlyingPrice: number;
  }) => void;
}

export function OptionForm({ onSubmit }: OptionFormProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [strike, setStrike] = useState("");
  const [expiration, setExpiration] = useState("");
  const [premium, setPremium] = useState("");
  const [quantity, setQuantity] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [underlyingPrice, setUnderlyingPrice] = useState("");

  const reset = useCallback(() => {
    setSymbol("");
    setOptionType("call");
    setStrike("");
    setExpiration("");
    setPremium("");
    setQuantity("");
    setCurrentPrice("");
    setUnderlyingPrice("");
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const strikeNum = Number(strike);
      const premiumNum = Number(premium);
      const qtyNum = Number(quantity);
      const curPriceNum = Number(currentPrice) || premiumNum;
      const underPriceNum = Number(underlyingPrice);

      if (!symbol || !strikeNum || !expiration || !premiumNum || !qtyNum || !underPriceNum) {
        return;
      }

      onSubmit({
        symbol: symbol.toUpperCase().trim(),
        optionType,
        strike: strikeNum,
        expiration,
        premium: premiumNum,
        quantity: qtyNum,
        currentPrice: curPriceNum,
        underlyingPrice: underPriceNum,
      });

      reset();
      setOpen(false);
    },
    [symbol, optionType, strike, expiration, premium, quantity, currentPrice, underlyingPrice, onSubmit, reset],
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
      >
        <Plus size={16} />
        Add Position Manually
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-xl p-5 border border-border space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Add Option Position
        </h3>
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-symbol">
            Symbol
          </label>
          <input
            id="opt-symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="AAPL"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-type">
            Type
          </label>
          <select
            id="opt-type"
            value={optionType}
            onChange={(e) => setOptionType(e.target.value as "call" | "put")}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-gray-500"
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-strike">
            Strike Price
          </label>
          <input
            id="opt-strike"
            type="number"
            step="0.01"
            value={strike}
            onChange={(e) => setStrike(e.target.value)}
            placeholder="200"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-expiry">
            Expiration
          </label>
          <input
            id="opt-expiry"
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-premium">
            Premium (per share)
          </label>
          <input
            id="opt-premium"
            type="number"
            step="0.01"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            placeholder="5.50"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-qty">
            Quantity
          </label>
          <input
            id="opt-qty"
            type="number"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="2 (negative = short)"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-curprice">
            Current Option Price
          </label>
          <input
            id="opt-curprice"
            type="number"
            step="0.01"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="Same as premium if empty"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1" htmlFor="opt-underprice">
            Underlying Price
          </label>
          <input
            id="opt-underprice"
            type="number"
            step="0.01"
            value={underlyingPrice}
            onChange={(e) => setUnderlyingPrice(e.target.value)}
            placeholder="203.50"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Add Position
      </button>
    </form>
  );
}
