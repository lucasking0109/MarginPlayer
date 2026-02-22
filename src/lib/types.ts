export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marginRate: number; // Default 0.30 (Schwab standard), user-configurable
}

export interface AccountInfo {
  cashBalance: number;
  marginLoan: number;
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fees: number;
}

export type HealthLevel = "safe" | "warning" | "danger" | "margin-call";

export interface MarginStatus {
  totalMarketValue: number;
  totalEquity: number;
  marginUsageRate: number;
  maintenanceRequired: number;
  excessEquity: number;
  distanceToMarginCall: number;
  buyingPower: number;
  healthLevel: HealthLevel;
  concentratedPositions: string[];
}

export interface PositionAnalysis {
  symbol: string;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
  marginRequired: number;
  marginFreedIfSold: number;
  newMarginRateIfSold: number;
}

export interface DayTradeSummary {
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  dayTradesLast5Days: number;
}
