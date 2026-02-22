"use client";

import { useState, useCallback } from "react";

export function useStockPrices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(
    async (symbols: string[]): Promise<Record<string, number>> => {
      if (symbols.length === 0) return {};

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/quotes?symbols=${symbols.join(",")}`,
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setLastUpdated(new Date());
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to fetch prices";
        setError(msg);
        return {};
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { fetchPrices, loading, error, lastUpdated };
}
