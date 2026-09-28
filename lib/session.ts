import { NextResponse } from "next/server";
import { AUTH_COOKIE, isValidAuthCookie } from "@/lib/auth";

export async function requireSession(request: Request): Promise<NextResponse | null> {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${AUTH_COOKIE}=`))
    ?.slice(AUTH_COOKIE.length + 1);

  if (!(await isValidAuthCookie(token))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
