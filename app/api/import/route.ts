import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface T212Row {
  Action: string;
  Time: string;
  ISIN?: string;
  Ticker?: string;
  Name?: string;
  "No. of shares"?: string;
  "Price / share"?: string;
  "Currency (Price / share)"?: string;
  "Exchange rate"?: string;
  "Result (EUR)"?: string;
  "Total (EUR)"?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rows }: { rows: T212Row[] } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const positionMap: Record<string, {
      ticker: string;
      name: string;
      totalQty: number;
      totalCost: number;
      currency: string;
    }> = {};

    for (const row of rows) {
      if (!row.Action?.toLowerCase().includes("buy")) continue;
      const ticker = row.Ticker?.trim();
      if (!ticker) continue;
      const qty = parseFloat(row["No. of shares"] || "0");
      const price = parseFloat(row["Price / share"] || "0");
      if (qty <= 0 || price <= 0) continue;

      if (!positionMap[ticker]) {
        positionMap[ticker] = {
          ticker,
          name: row.Name || ticker,
          totalQty: 0,
          totalCost: 0,
          currency: row["Currency (Price / share)"] || "USD",
        };
      }
      positionMap[ticker].totalQty += qty;
      positionMap[ticker].totalCost += qty * price;
    }

    const positions = Object.values(positionMap);
    let created = 0;
    for (const p of positions) {
      if (p.totalQty <= 0) continue;
      const avgPrice = p.totalCost / p.totalQty;
      await prisma.position.upsert({
        where: { id: "import-" + p.ticker },
        create: {
          id: "import-" + p.ticker,
          ticker: p.ticker,
          name: p.name,
          type: "stock",
          quantity: p.totalQty,
          avgPrice,
          currency: p.currency,
        },
        update: {
          quantity: p.totalQty,
          avgPrice,
        },
      });
      created++;
    }

    return NextResponse.json({ imported: created, total: rows.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
