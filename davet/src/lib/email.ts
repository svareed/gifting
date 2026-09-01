/**
 * Email delivery, if it is configured. Davet is useful without it, the
 * WhatsApp path is click-to-send and needs no provider at all, so a missing
 * key is a state to report, never a crash.
 *
 * RESEND_API_KEY and REMINDER_FROM turn this on.
 */
export const EMAIL_CONFIGURED = Boolean(
  process.env.RESEND_API_KEY && process.env.REMINDER_FROM,
);

export async function sendEmail(
  to: string, subject: string, text: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!EMAIL_CONFIGURED) return { ok: false, error: "email_not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.REMINDER_FROM, to: [to], subject, text,
      }),
    });
    if (!res.ok) return { ok: false, error: `resend_${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  }
}
