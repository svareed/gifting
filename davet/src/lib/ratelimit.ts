import type { Store, SubmissionKind } from "./db";

/**
 * Counts prior submissions in the database rather than in process memory,
 * because on Vercel each serverless instance holds its own memory and a
 * per-process counter would multiply the real limit by the instance count.
 *
 * Visitors behind a shared address (a wedding party on one venue wifi) share a
 * bucket, so the window is deliberately generous.
 */
export async function withinRateLimit(
  db: Store,
  kind: SubmissionKind,
  ipHash: string | null,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  // No address to attribute — the honeypot and published-only checks still apply.
  if (!ipHash) return true;

  const sinceIso = new Date(Date.now() - windowMs).toISOString();
  try {
    return (await db.countRecentSubmissions(kind, ipHash, sinceIso)) < limit;
  } catch {
    // A counting failure must not block a genuine guest from replying.
    return true;
  }
}
