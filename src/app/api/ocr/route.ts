import { NextResponse } from "next/server";
import OpenAI from "openai";

const EXTRACTION_PROMPT = `You are analyzing a screenshot of options positions from a trading platform (likely Charles Schwab).

Extract ALL options positions visible in the image. For each position, return:
- symbol: the underlying stock ticker (e.g., "AAPL")
- optionType: "call" or "put"
- strike: the strike price (number)
- expiration: expiration date in YYYY-MM-DD format
- premium: the price/cost per contract (number)
- quantity: number of contracts (positive for long, negative for short/written)
- currentPrice: current option price if visible, otherwise use premium
- underlyingPrice: current underlying stock price if visible, otherwise estimate from strike

Return ONLY a valid JSON array. Example:
[
  {
    "symbol": "AAPL",
    "optionType": "call",
    "strike": 200,
    "expiration": "2026-03-21",
    "premium": 5.50,
    "quantity": 2,
    "currentPrice": 6.20,
    "underlyingPrice": 203.50
  }
]

If you cannot extract positions or the image is not an options view, return an empty array: []`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content ?? "[]";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse response", raw: content },
        { status: 422 },
      );
    }

    const positions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 422 },
      );
    }

    const validated = positions.filter(
      (p: Record<string, unknown>) =>
        typeof p.symbol === "string" &&
        (p.optionType === "call" || p.optionType === "put") &&
        typeof p.strike === "number" &&
        typeof p.expiration === "string" &&
        typeof p.premium === "number" &&
        typeof p.quantity === "number",
    );

    return NextResponse.json({ positions: validated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OCR processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
