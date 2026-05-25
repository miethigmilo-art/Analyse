import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  const symbols = "AAPL,MSFT,NVDA,TSLA";
  const results: Record<string, unknown> = {};

  // Test v7 query1
  try {
    const r1 = await axios.get(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 }
    );
    results["v7_query1"] = { status: r1.status, count: r1.data?.quoteResponse?.result?.length, sample: r1.data?.quoteResponse?.result?.[0]?.regularMarketPrice };
  } catch (e: unknown) {
    results["v7_query1"] = { error: String(e) };
  }

  // Test v7 query2
  try {
    const r2 = await axios.get(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 }
    );
    results["v7_query2"] = { status: r2.status, count: r2.data?.quoteResponse?.result?.length, sample: r2.data?.quoteResponse?.result?.[0]?.regularMarketPrice };
  } catch (e: unknown) {
    results["v7_query2"] = { error: String(e) };
  }

  // Test individual (known working)
  try {
    const r3 = await axios.get(
      "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d",
      { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 }
    );
    results["v8_single"] = { status: r3.status, price: r3.data?.chart?.result?.[0]?.meta?.regularMarketPrice };
  } catch (e: unknown) {
    results["v8_single"] = { error: String(e) };
  }

  return NextResponse.json(results);
}
