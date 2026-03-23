import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminPassword } from "../../../../lib/adminAuth";

export async function POST(request) {
  const body = await request.json();

  if (!isValidAdminPassword(body.password)) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return response;
}
