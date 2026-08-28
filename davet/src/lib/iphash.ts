import { createHash } from "node:crypto";

/**
 * Abuse counting needs a stable per-visitor key that is not a personal
 * identifier. The raw address is never stored, the hash is salted so it cannot
 * be reversed by rainbow table, and it is deleted along with the response by
 * purge_old_guest_data().
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.RATE_LIMIT_SALT ?? "davet-unsalted-dev-only";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}
