import { ImageResponse } from "next/og";
import { store } from "@/lib/db";
import { THEMES } from "@/lib/themes";
import { formatShortDate } from "@/lib/datetime";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Wedding invitation";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invite = await (await store()).getPublishedBySlug(slug);
  const theme = THEMES[invite?.theme ?? "ivory-gold"] ?? THEMES["ivory-gold"];
  const p = theme.palette;

  const names = invite
    ? `${invite.partnerAName} & ${invite.partnerBName}`
    : "Wedding";
  const when = invite?.events[0]
    ? formatShortDate(invite.events[0].startsAt, invite.locale, invite.timezone)
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: p.bg, color: p.ink,
        }}
      >
        <div style={{ width: 90, height: 1, background: p.rule, marginBottom: 36 }} />
        <div style={{ fontSize: 92, color: p.accent }}>{names}</div>
        {when ? (
          <div style={{ fontSize: 30, marginTop: 26, letterSpacing: 8, color: p.muted }}>
            {when}
          </div>
        ) : null}
        <div style={{ width: 90, height: 1, background: p.rule, marginTop: 36 }} />
      </div>
    ),
    size,
  );
}
