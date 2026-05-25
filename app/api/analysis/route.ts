import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SAMPLE_POSITIONS, calculatePortfolioMetrics, getAssetAllocation, getSectorAllocation, getCountryAllocation, calculateETFOverlap } from "@/lib/analysis";
import { fetchMultipleQuotes } from "@/lib/stocks";
import type { Position } from "@/lib/analysis";

export async function GET() {
  try {
    let positions: Position[] = [];
    let isDemo = false;
    try {
      positions = await prisma.position.findMany();
      if (positions.length === 0) {
        positions = SAMPLE_POSITIONS as unknown as Position[];
        isDemo = true;
      }
    } catch {
      positions = SAMPLE_POSITIONS as unknown as Position[];
      isDemo = true;
    }

    const tickers = [...new Set(positions.map((p) => p.ticker))];
    const quotes = await fetchMultipleQuotes(tickers);

    const metrics = calculatePortfolioMetrics(positions, quotes);
    const assetAllocation = getAssetAllocation(positions, quotes);
    const sectorAllocation = getSectorAllocation(positions, quotes);
    const countryAllocation = getCountryAllocation(positions, quotes);
    const etfOverlap = calculateETFOverlap(positions);

    return NextResponse.json({
      metrics,
      assetAllocation,
      sectorAllocation,
      countryAllocation,
      etfOverlap,
      isDemo,
    });
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
