import crypto from "crypto";

const COOKIE = "admin_session";

export function adminCookieName() { return COOKIE; }

export function createAdminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const payload = `admin:${Date.now()}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function validateAdminToken(token?: string) {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(":");
    const sig = parts.pop() || "";
    const payload = parts.join(":");
    const secret = process.env.ADMIN_SESSION_SECRET || "";
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const ts = Number(parts[1]);
    return Date.now() - ts < 1000 * 60 * 60 * 12;
  } catch { return false; }
}
