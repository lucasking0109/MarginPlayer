import { NextResponse } from "next/server";

const cache = new Map<string, { price: number; ts: number }>();
const CACHE_TTL = 60_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols =
    searchParams.get("symbols")?.split(",").filter(Boolean) || [];

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "No symbols provided" },
      { status: 400 },
    );
  }

  const results: Record<string, number> = {};
  const toFetch: string[] = [];

  for (const sym of symbols) {
    const upper = sym.toUpperCase();
    const cached = cache.get(upper);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      results[upper] = cached.price;
    } else {
      toFetch.push(upper);
    }
  }

  if (toFetch.length > 0) {
    const fetches = toFetch.map(async (sym) => {
      // Try Yahoo chart first, then Google Finance scrape
      const price =
        (await fetchYahooChart(sym)) ?? (await fetchGoogleFinance(sym));
      if (price !== null) {
        results[sym] = price;
        cache.set(sym, { price, ts: Date.now() });
      }
    });
    await Promise.all(fetches);
  }

  return NextResponse.json(results);
}

// Exchanges for Google Finance URL
const EXCHANGE_MAP: Record<string, string> = {
  AAPL: "NASDAQ",  MSFT: "NASDAQ",  GOOGL: "NASDAQ", GOOG: "NASDAQ",
  AMZN: "NASDAQ",  META: "NASDAQ",  NVDA: "NASDAQ",  TSLA: "NASDAQ",
  AMD: "NASDAQ",   INTC: "NASDAQ",  NFLX: "NASDAQ",  PYPL: "NASDAQ",
  COST: "NASDAQ",  AVGO: "NASDAQ",  ADBE: "NASDAQ",  CRM: "NASDAQ",
  QCOM: "NASDAQ",  INTU: "NASDAQ",  AMAT: "NASDAQ",  MU: "NASDAQ",
  MRVL: "NASDAQ",  LRCX: "NASDAQ",  KLAC: "NASDAQ",  SNPS: "NASDAQ",
  CDNS: "NASDAQ",  CRWD: "NASDAQ",  PANW: "NASDAQ",  DDOG: "NASDAQ",
  ZS: "NASDAQ",    MELI: "NASDAQ",  BKNG: "NASDAQ",  ABNB: "NASDAQ",
  COIN: "NASDAQ",  PLTR: "NASDAQ",  MSTR: "NASDAQ",  SMCI: "NASDAQ",
  ARM: "NASDAQ",   SOFI: "NASDAQ",  RIVN: "NASDAQ",  LCID: "NASDAQ",
};

function getExchange(symbol: string): string {
  return EXCHANGE_MAP[symbol] || "NYSE";
}

async function fetchYahooChart(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice ?? meta?.previousClose;

    return typeof price === "number" && price > 0
      ? Math.round(price * 100) / 100
      : null;
  } catch {
    return null;
  }
}

async function fetchGoogleFinance(symbol: string): Promise<number | null> {
  try {
    const exchange = getExchange(symbol);
    const url = `https://www.google.com/finance/quote/${symbol}:${exchange}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract price from data-last-price attribute
    const match = html.match(/data-last-price="([\d.]+)"/);
    if (match?.[1]) {
      const price = parseFloat(match[1]);
      if (price > 0) return Math.round(price * 100) / 100;
    }

    return null;
  } catch {
    return null;
  }
}
