import { NextResponse } from "next/server";
import { fetchMultipleQuotes, fetchHistorical } from "@/lib/stocks";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tickers = searchParams.get("tickers")?.split(",").filter(Boolean) || [];
  const ticker = searchParams.get("ticker");
  const range = searchParams.get("range") as "5d" | "1mo" | "3mo" | "1y" || "1mo";
  const mode = searchParams.get("mode") || "quotes";

  if (mode === "history" && ticker) {
    const data = await fetchHistorical(ticker, range);
    return NextResponse.json({ data });
  }

  if (tickers.length > 0) {
    const quotes = await fetchMultipleQuotes(tickers);
    return NextResponse.json({ quotes });
  }

  return NextResponse.json({ error: "Missing tickers" }, { status: 400 });
}
