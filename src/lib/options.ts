import type {
  OptionPosition,
  OptionsSummary,
  PnlDataPoint,
  OptionLeverage,
} from "./types";

// ---------- Delta Estimation ----------

export function daysToExpiration(expiration: string): number {
  const exp = new Date(expiration + "T16:00:00");
  const now = new Date();
  const diff = exp.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Simplified delta estimation based on moneyness and time to expiration.
 * Does not require implied volatility input.
 */
export function estimateDelta(
  optionType: "call" | "put",
  strike: number,
  underlyingPrice: number,
  dte: number,
): number {
  const moneyness = underlyingPrice / strike;
  const timeDecay = Math.max(0.01, Math.sqrt(dte / 365));

  let delta: number;

  if (optionType === "call") {
    if (moneyness >= 1.1) {
      delta = 0.7 + 0.25 * Math.min((moneyness - 1.1) / 0.2, 1);
    } else if (moneyness >= 0.95) {
      delta = 0.3 + 0.4 * ((moneyness - 0.95) / 0.15);
    } else {
      delta = Math.max(0.02, 0.3 * Math.pow(moneyness / 0.95, 3));
    }
    delta =
      delta +
      (1 - timeDecay) * (moneyness > 1 ? (1 - delta) * 0.3 : -delta * 0.3);
    return Math.max(0.01, Math.min(0.99, delta));
  }

  // Put delta = -(1 - call delta)
  const callDelta = estimateDelta("call", strike, underlyingPrice, dte);
  return -(1 - callDelta);
}

// ---------- Leverage & Exposure ----------

export function calculateLeverage(position: OptionPosition): OptionLeverage {
  const absDelta = Math.abs(position.delta);
  const leverageRatio =
    position.premium > 0
      ? (absDelta * position.underlyingPrice) / position.premium
      : 0;

  const notionalExposure = Math.abs(
    position.quantity * 100 * position.underlyingPrice * absDelta,
  );

  const breakEvenPrice =
    position.optionType === "call"
      ? position.strike + position.premium
      : position.strike - position.premium;

  const maxLoss =
    position.quantity > 0
      ? Math.abs(position.quantity) * 100 * position.premium
      : Infinity;

  const deltaExposure = position.quantity * 100 * position.delta;

  return {
    leverageRatio,
    notionalExposure,
    breakEvenPrice,
    maxLoss,
    deltaExposure,
  };
}

// ---------- Summary ----------

export function calculateOptionsSummary(
  positions: OptionPosition[],
): OptionsSummary {
  let totalNotional = 0;
  let netDelta = 0;
  let totalPremiumPaid = 0;
  let totalCurrentValue = 0;

  for (const p of positions) {
    const lev = calculateLeverage(p);
    totalNotional += lev.notionalExposure;
    netDelta += lev.deltaExposure;
    totalPremiumPaid += Math.abs(p.quantity) * 100 * p.premium;
    totalCurrentValue += Math.abs(p.quantity) * 100 * p.currentPrice;
  }

  return {
    totalNotional,
    netDelta,
    totalPremiumPaid,
    totalCurrentValue,
    totalPnl: totalCurrentValue - totalPremiumPaid,
  };
}

// ---------- P&L Simulation ----------

function optionPnlAtExpiration(
  position: OptionPosition,
  underlyingPrice: number,
): number {
  const intrinsicValue =
    position.optionType === "call"
      ? Math.max(0, underlyingPrice - position.strike)
      : Math.max(0, position.strike - underlyingPrice);

  return (intrinsicValue - position.premium) * position.quantity * 100;
}

export function simulatePnl(
  positions: OptionPosition[],
  rangePercent: number = 30,
  steps: number = 61,
): PnlDataPoint[] {
  if (positions.length === 0) return [];

  const centerPrice = positions[0].underlyingPrice;
  const minPrice = centerPrice * (1 - rangePercent / 100);
  const maxPrice = centerPrice * (1 + rangePercent / 100);
  const stepSize = (maxPrice - minPrice) / (steps - 1);

  const dataPoints: PnlDataPoint[] = [];

  for (let idx = 0; idx < steps; idx++) {
    const price = minPrice + stepSize * idx;
    let totalPnl = 0;

    for (const pos of positions) {
      totalPnl += optionPnlAtExpiration(pos, price);
    }

    const point: PnlDataPoint = {
      underlyingPrice: Math.round(price * 100) / 100,
      pnl: Math.round(totalPnl * 100) / 100,
    };

    if (Math.abs(price - centerPrice) < stepSize / 2) {
      point.label = "current";
    }

    dataPoints.push(point);
  }

  return dataPoints;
}

// ---------- Colors ----------

export function getLeverageColor(ratio: number): string {
  if (ratio <= 3) return "#22c55e";
  if (ratio <= 8) return "#f59e0b";
  if (ratio <= 15) return "#ef4444";
  return "#dc2626";
}
