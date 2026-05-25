import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SAMPLE_POSITIONS } from "@/lib/analysis";
import { z } from "zod";

const PositionSchema = z.object({
  ticker: z.string().min(1).max(20),
  name: z.string().min(1),
  type: z.enum(["stock", "etf", "crypto", "cash"]),
  quantity: z.number().positive(),
  avgPrice: z.number().positive(),
  currency: z.string().default("USD"),
  sector: z.string().optional(),
  country: z.string().optional(),
});

export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { addedAt: "desc" },
    });
    // Return demo data if empty
    if (positions.length === 0) {
      return NextResponse.json({ positions: SAMPLE_POSITIONS, demo: true });
    }
    return NextResponse.json({ positions, demo: false });
  } catch {
    return NextResponse.json({ positions: SAMPLE_POSITIONS, demo: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = PositionSchema.parse(body);
    const position = await prisma.position.create({ data });
    return NextResponse.json({ position }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.position.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const position = await prisma.position.update({ where: { id }, data });
    return NextResponse.json({ position });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
