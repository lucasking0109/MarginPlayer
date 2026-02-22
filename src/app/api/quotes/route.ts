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
    const fetched = await fetchYahooV8(toFetch);
    if (fetched) {
      Object.assign(results, fetched);
    }
  }

  return NextResponse.json(results);
}

// Use Yahoo Finance v8 API directly (no npm package needed)
async function fetchYahooV8(
  symbols: string[],
): Promise<Record<string, number> | null> {
  try {
    const symbolStr = symbols.join(",");
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbolStr}&range=1d&interval=1d`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      console.error(`Yahoo v8 API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const results: Record<string, number> = {};

    for (const sym of symbols) {
      const spark = data?.spark?.result?.find(
        (r: Record<string, unknown>) => r.symbol === sym,
      );
      const close =
        spark?.response?.[0]?.meta?.regularMarketPrice ??
        spark?.response?.[0]?.meta?.previousClose;

      if (close && typeof close === "number" && close > 0) {
        results[sym] = close;
        cache.set(sym, { price: close, ts: Date.now() });
      }
    }

    if (Object.keys(results).length > 0) return results;

    // Fallback: try v6 quote endpoint
    return await fetchYahooV6(symbols);
  } catch (e) {
    console.error("Yahoo v8 error:", e);
    return await fetchYahooV6(symbols);
  }
}

async function fetchYahooV6(
  symbols: string[],
): Promise<Record<string, number> | null> {
  try {
    const symbolStr = symbols.join(",");
    const url = `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbolStr}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const results: Record<string, number> = {};

    const quotes = data?.quoteResponse?.result || [];
    for (const q of quotes) {
      if (q?.symbol && q?.regularMarketPrice) {
        results[q.symbol] = q.regularMarketPrice;
        cache.set(q.symbol, {
          price: q.regularMarketPrice,
          ts: Date.now(),
        });
      }
    }

    return Object.keys(results).length > 0 ? results : null;
  } catch (e) {
    console.error("Yahoo v6 error:", e);
    return null;
  }
}
