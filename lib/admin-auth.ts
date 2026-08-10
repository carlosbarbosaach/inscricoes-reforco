import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

export function adminCookieName() {
  return COOKIE_NAME;
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET não está configurado."
    );
  }

  return secret;
}

export function createAdminToken() {
  const secret = getSecret();

  return createHmac("sha256", secret)
    .update("admin-authenticated")
    .digest("hex");
}

export function validateAdminToken(token: string) {
  try {
    const expected = createAdminToken();

    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expected);

    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(
      tokenBuffer,
      expectedBuffer
    );
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return validateAdminToken(token);
}