import Papa from "papaparse";
import type { Position } from "./types";

interface SchwabRow {
  Symbol?: string;
  Quantity?: string;
  Price?: string;
  "Cost Basis"?: string;
  "Market Value"?: string;
  "% Of Account"?: string;
  [key: string]: string | undefined;
}

function cleanCurrency(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,]/g, "")) || 0;
}

export function parseSchwabCSV(
  csvText: string,
): Omit<Position, "id">[] {
  // Schwab CSV starts with a metadata line like:
  // "Positions for account XXXX-1234 as of 10:30:00 AM ET, 02/22/2026"
  // Skip it by finding the actual header row
  const lines = csvText.split("\n");
  let startIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Symbol") && lines[i].includes("Quantity")) {
      startIndex = i;
      break;
    }
  }

  const cleanedCSV = lines.slice(startIndex).join("\n");

  const result = Papa.parse<SchwabRow>(cleanedCSV, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().replace(/^"|"$/g, ""),
  });

  const positions: Omit<Position, "id">[] = [];

  for (const row of result.data) {
    const symbol = row.Symbol?.trim().replace(/^"|"$/g, "");

    // Skip totals row, cash rows, and empty symbols
    if (
      !symbol ||
      symbol === "" ||
      symbol.toLowerCase().includes("total") ||
      symbol.toLowerCase().includes("cash") ||
      symbol.toLowerCase().includes("account")
    ) {
      continue;
    }

    const quantity = cleanCurrency(row.Quantity);
    const price = cleanCurrency(row.Price);
    const costBasis = cleanCurrency(row["Cost Basis"]);

    if (quantity <= 0 || price <= 0) continue;

    const avgCost = costBasis > 0 ? costBasis / quantity : price;

    positions.push({
      symbol: symbol.toUpperCase(),
      quantity,
      avgCost,
      currentPrice: price,
      marginRate: 0.3, // Schwab default
    });
  }

  return positions;
}
