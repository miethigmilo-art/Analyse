import { NextRequest, NextResponse } from 'next/server';
import { searchStocks } from '@/lib/api/stocks';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.length < 1) return NextResponse.json([]);
  const results = await searchStocks(q);
  return NextResponse.json(results);
}
