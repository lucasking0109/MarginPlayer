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
    // Fetch each symbol individually using Yahoo chart API
    const fetches = toFetch.map(async (sym) => {
      const price = await fetchYahooChart(sym);
      if (price !== null) {
        results[sym] = price;
        cache.set(sym, { price, ts: Date.now() });
      }
    });
    await Promise.all(fetches);
  }

  return NextResponse.json(results);
}

async function fetchYahooChart(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`Yahoo chart API ${symbol}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    const price =
      meta?.regularMarketPrice ?? meta?.previousClose ?? null;

    if (typeof price === "number" && price > 0) {
      return Math.round(price * 100) / 100;
    }

    return null;
  } catch (e) {
    console.error(`Yahoo chart error for ${symbol}:`, e);
    return null;
  }
}
