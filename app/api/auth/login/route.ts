import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_ATTEMPTS = 3;
const lockouts: Record<string, { count: number; lockedUntil?: number }> = {};

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const lockout = lockouts[ip];
  if (lockout?.lockedUntil && Date.now() < lockout.lockedUntil) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { password } = body;
  const APP_PASSWORD = process.env.APP_PASSWORD || "portfolio2025";

  if (password === APP_PASSWORD) {
    lockouts[ip] = { count: 0 };
    const res = NextResponse.json({ success: true });
    res.cookies.set("pi_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return res;
  }

  lockouts[ip] = {
    count: (lockout?.count || 0) + 1,
    lockedUntil:
      (lockout?.count || 0) + 1 >= MAX_ATTEMPTS
        ? Date.now() + 15 * 60 * 1000
        : undefined,
  };

  const remaining = MAX_ATTEMPTS - (lockouts[ip].count);
  return NextResponse.json(
    {
      error:
        remaining <= 0
          ? "Too many failed attempts. Locked for 15 minutes."
          : `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      locked: remaining <= 0,
    },
    { status: 401 }
  );
}
