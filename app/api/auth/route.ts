import { NextResponse } from "next/server";
import { AUTH_COOKIE, expectedAuthToken, passwordsMatch } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password ?? "";
    const expected = process.env.APP_SECRET_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "APP_SECRET_PASSWORD is not configured." },
        { status: 500 }
      );
    }

    if (!passwordsMatch(password, expected)) {
      return NextResponse.json(
        { error: "Invalid company PIN. Try again or contact operations." },
        { status: 401 }
      );
    }

    const token = await expectedAuthToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
