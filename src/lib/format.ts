export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatPnl(value: number): string {
  const formatted = formatUSD(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function formatDelta(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}
