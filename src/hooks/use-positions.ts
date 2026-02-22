"use client";

import { useCallback } from "react";
import type { Position } from "@/lib/types";
import { useLocalStorage } from "./use-local-storage";

export function usePositions() {
  const [positions, setPositions, loaded] = useLocalStorage<Position[]>(
    "mp-positions",
    [],
  );

  const addPosition = useCallback(
    (position: Omit<Position, "id">) => {
      setPositions((prev) => [
        ...prev,
        { ...position, id: crypto.randomUUID() },
      ]);
    },
    [setPositions],
  );

  const updatePosition = useCallback(
    (id: string, updates: Partial<Position>) => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [setPositions],
  );

  const removePosition = useCallback(
    (id: string) => {
      setPositions((prev) => prev.filter((p) => p.id !== id));
    },
    [setPositions],
  );

  const updatePrices = useCallback(
    (prices: Record<string, number>) => {
      setPositions((prev) =>
        prev.map((p) =>
          prices[p.symbol] !== undefined
            ? { ...p, currentPrice: prices[p.symbol] }
            : p,
        ),
      );
    },
    [setPositions],
  );

  const importPositions = useCallback(
    (newPositions: Omit<Position, "id">[]) => {
      setPositions((prev) => [
        ...prev,
        ...newPositions.map((p) => ({ ...p, id: crypto.randomUUID() })),
      ]);
    },
    [setPositions],
  );

  return {
    positions,
    loaded,
    addPosition,
    updatePosition,
    removePosition,
    updatePrices,
    importPositions,
    setPositions,
  };
}
