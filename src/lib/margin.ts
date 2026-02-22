import type {
  Position,
  AccountInfo,
  MarginStatus,
  HealthLevel,
  PositionAnalysis,
} from "./types";

const CONCENTRATION_THRESHOLD = 0.3; // 30% of account → flagged

export function calculateMarginStatus(
  positions: Position[],
  account: AccountInfo,
): MarginStatus {
  const totalMarketValue = positions.reduce(
    (sum, p) => sum + p.quantity * p.currentPrice,
    0,
  );

  const totalEquity =
    totalMarketValue - account.marginLoan + account.cashBalance;

  const marginUsageRate =
    totalMarketValue > 0 ? account.marginLoan / totalMarketValue : 0;

  const maintenanceRequired = positions.reduce(
    (sum, p) => sum + p.quantity * p.currentPrice * p.marginRate,
    0,
  );

  const excessEquity = totalEquity - maintenanceRequired;
  const distanceToMarginCall = excessEquity;

  // Buying power: how much more you can buy (Reg-T: 2x excess for overnight)
  const buyingPower = Math.max(0, excessEquity * 2);

  const healthLevel = getHealthLevel(marginUsageRate, excessEquity);

  const concentratedPositions = positions
    .filter(
      (p) =>
        totalMarketValue > 0 &&
        (p.quantity * p.currentPrice) / totalMarketValue >
          CONCENTRATION_THRESHOLD,
    )
    .map((p) => p.symbol);

  return {
    totalMarketValue,
    totalEquity,
    marginUsageRate,
    maintenanceRequired,
    excessEquity,
    distanceToMarginCall,
    buyingPower,
    healthLevel,
    concentratedPositions,
  };
}

function getHealthLevel(
  usageRate: number,
  excessEquity: number,
): HealthLevel {
  if (excessEquity <= 0) return "margin-call";
  if (usageRate > 0.7) return "danger";
  if (usageRate > 0.5) return "warning";
  return "safe";
}

export function analyzePositions(
  positions: Position[],
  account: AccountInfo,
): PositionAnalysis[] {
  const status = calculateMarginStatus(positions, account);

  return positions
    .map((p) => {
      const marketValue = p.quantity * p.currentPrice;
      const costBasis = p.quantity * p.avgCost;
      const pnl = marketValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      const weight =
        status.totalMarketValue > 0
          ? marketValue / status.totalMarketValue
          : 0;
      const marginRequired = marketValue * p.marginRate;

      // If we sell this position: margin loan decreases by marketValue,
      // total market value decreases by marketValue
      const remainingPositions = positions.filter((op) => op.id !== p.id);
      const newStatus = calculateMarginStatus(remainingPositions, {
        ...account,
        marginLoan: Math.max(0, account.marginLoan - marketValue),
        cashBalance: account.cashBalance + marketValue,
      });

      return {
        symbol: p.symbol,
        marketValue,
        costBasis,
        pnl,
        pnlPercent,
        weight,
        marginRequired,
        marginFreedIfSold: status.marginUsageRate - newStatus.marginUsageRate,
        newMarginRateIfSold: newStatus.marginUsageRate,
      };
    })
    .sort((a, b) => a.pnlPercent - b.pnlPercent); // Worst performers first
}

export function simulateStress(
  positions: Position[],
  account: AccountInfo,
  dropPercent: number,
): MarginStatus {
  const stressedPositions = positions.map((p) => ({
    ...p,
    currentPrice: p.currentPrice * (1 - dropPercent / 100),
  }));
  return calculateMarginStatus(stressedPositions, account);
}

export function simulateSymbolDrop(
  positions: Position[],
  account: AccountInfo,
  symbol: string,
  dropPercent: number,
): MarginStatus {
  const stressedPositions = positions.map((p) =>
    p.symbol === symbol
      ? { ...p, currentPrice: p.currentPrice * (1 - dropPercent / 100) }
      : p,
  );
  return calculateMarginStatus(stressedPositions, account);
}

export const HEALTH_COLORS: Record<HealthLevel, string> = {
  safe: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  "margin-call": "#dc2626",
};

export const HEALTH_LABELS: Record<HealthLevel, string> = {
  safe: "SAFE",
  warning: "WARNING",
  danger: "DANGER",
  "margin-call": "MARGIN CALL",
};
