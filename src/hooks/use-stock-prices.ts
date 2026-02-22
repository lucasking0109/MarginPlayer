"use client";

import { useState, useCallback } from "react";

export function useStockPrices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchPrices = useCallback(
    async (symbols: string[]): Promise<Record<string, number>> => {
      if (symbols.length === 0) return {};

      setLoading(true);
      setError(null);
      setLastResult(null);

      try {
        const res = await fetch(
          `/api/quotes?symbols=${symbols.join(",")}`,
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API ${res.status}: ${text.slice(0, 100)}`);
        }
        const data = await res.json();
        const count = Object.keys(data).length;
        if (count === 0) {
          setLastResult(`No prices returned for: ${symbols.join(", ")}`);
        } else {
          const summary = Object.entries(data)
            .map(([s, p]) => `${s}: $${(p as number).toFixed(2)}`)
            .join(", ");
          setLastResult(`Updated ${count}/${symbols.length}: ${summary}`);
        }
        setLastUpdated(new Date());
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch prices";
        setError(msg);
        setLastResult(null);
        return {};
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { fetchPrices, loading, error, lastUpdated, lastResult };
}
