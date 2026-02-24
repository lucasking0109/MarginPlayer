"use client";

import { useCallback } from "react";
import type { OptionPosition } from "@/lib/types";
import { useLocalStorage } from "./use-local-storage";
import { estimateDelta, daysToExpiration } from "@/lib/options";

export function useOptions() {
  const [positions, setPositions, loaded] = useLocalStorage<OptionPosition[]>(
    "mp-options",
    [],
  );

  const addPosition = useCallback(
    (position: Omit<OptionPosition, "id" | "delta">) => {
      const dte = daysToExpiration(position.expiration);
      const delta = estimateDelta(
        position.optionType,
        position.strike,
        position.underlyingPrice,
        dte,
      );
      setPositions((prev) => [
        ...prev,
        { ...position, delta, id: crypto.randomUUID() },
      ]);
    },
    [setPositions],
  );

  const removePosition = useCallback(
    (id: string) => {
      setPositions((prev) => prev.filter((p) => p.id !== id));
    },
    [setPositions],
  );

  const importPositions = useCallback(
    (newPositions: Omit<OptionPosition, "id" | "delta">[]) => {
      setPositions((prev) => [
        ...prev,
        ...newPositions.map((p) => {
          const dte = daysToExpiration(p.expiration);
          const delta = estimateDelta(
            p.optionType,
            p.strike,
            p.underlyingPrice,
            dte,
          );
          return { ...p, delta, id: crypto.randomUUID() };
        }),
      ]);
    },
    [setPositions],
  );

  const clearPositions = useCallback(() => {
    setPositions([]);
  }, [setPositions]);

  return {
    positions,
    loaded,
    addPosition,
    removePosition,
    importPositions,
    clearPositions,
  };
}
