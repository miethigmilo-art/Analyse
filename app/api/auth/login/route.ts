import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.APP_PASSWORD || 'helix2025';

  if (password === correct) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('helix_auth', correct, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
