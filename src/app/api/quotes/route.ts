import { NextResponse } from "next/server";

// In-memory cache: { symbol: { price, timestamp } }
const cache = new Map<string, { price: number; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) || [];

  if (symbols.length === 0) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  const results: Record<string, number> = {};
  const toFetch: string[] = [];

  // Check cache first
  for (const sym of symbols) {
    const cached = cache.get(sym.toUpperCase());
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      results[sym.toUpperCase()] = cached.price;
    } else {
      toFetch.push(sym.toUpperCase());
    }
  }

  if (toFetch.length > 0) {
    // Try Yahoo Finance first
    const yahooResults = await fetchYahoo(toFetch);

    if (yahooResults) {
      Object.assign(results, yahooResults);
    } else {
      // Fallback to Finnhub
      const finnhubResults = await fetchFinnhub(toFetch);
      if (finnhubResults) {
        Object.assign(results, finnhubResults);
      }
    }
  }

  return NextResponse.json(results);
}

async function fetchYahoo(
  symbols: string[],
): Promise<Record<string, number> | null> {
  try {
    const yahooFinance = await import("yahoo-finance2").then((m) => m.default);
    const results: Record<string, number> = {};

    const quotes = await yahooFinance.quote(symbols) as Record<string, unknown>[];
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    for (const q of quotesArray) {
      const sym = q?.symbol as string | undefined;
      const price = q?.regularMarketPrice as number | undefined;
      if (sym && price) {
        results[sym] = price;
        cache.set(sym, { price, ts: Date.now() });
      }
    }

    return Object.keys(results).length > 0 ? results : null;
  } catch (e) {
    console.error("Yahoo Finance error:", e);
    return null;
  }
}

async function fetchFinnhub(
  symbols: string[],
): Promise<Record<string, number> | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.warn("No FINNHUB_API_KEY set, skipping fallback");
    return null;
  }

  try {
    const results: Record<string, number> = {};

    // Finnhub requires one call per symbol
    const fetches = symbols.slice(0, 10).map(async (sym) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.c > 0) {
          results[sym] = data.c; // current price
          cache.set(sym, { price: data.c, ts: Date.now() });
        }
      }
    });

    await Promise.all(fetches);
    return Object.keys(results).length > 0 ? results : null;
  } catch (e) {
    console.error("Finnhub error:", e);
    return null;
  }
}
