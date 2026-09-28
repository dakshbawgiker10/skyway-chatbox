export const AUTH_COOKIE = "skyway_gate";

export async function expectedAuthToken(): Promise<string> {
  const secret = process.env.APP_SECRET_PASSWORD;
  if (!secret) {
    throw new Error("APP_SECRET_PASSWORD is not configured.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("skyway-authenticated")
  );
  return bufferToHex(signature);
}

export async function isValidAuthCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  try {
    const expected = await expectedAuthToken();
    return timingSafeEqual(value, expected);
  } catch {
    return false;
  }
}

export function passwordsMatch(input: string, expected: string): boolean {
  return timingSafeEqual(input, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
