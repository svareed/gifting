import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { store } from "@/lib/db";
import { THEMES, type FontPairing } from "@/lib/themes";
import { SITE_URL } from "@/lib/config";
import { formatShortDate } from "@/lib/datetime";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Wedding invitation";

/**
 * The cover photograph, inlined as bytes. ImageResponse would otherwise fetch
 * the URL itself, and a 404 or an unsupported format there fails the whole
 * route — so it is fetched here, where a failure can fall back to the
 * type-only card instead of a broken preview.
 *
 * This card is the first thing almost every guest sees, because almost every
 * guest arrives through a WhatsApp link preview.
 */
/** Satori decodes these and nothing else; anything else 500s the whole route. */
const OG_IMAGE_TYPES = ["image/jpeg", "image/png"];

/**
 * The display face per theme. Satori has no access to the browser's font
 * stack, so without this the share card — the first thing almost every guest
 * sees — sets the couple's names in whatever sans the renderer defaults to,
 * on every theme. next/font's copies live in the build output under hashed
 * names, so the files are vendored instead.
 */
const OG_FONT_FILE: Record<FontPairing, string> = {
  classic: "CormorantGaramond.ttf",
  deco: "Cinzel.ttf",
  modern: "PlayfairDisplay.ttf",
  garamond: "EBGaramond.ttf",
  editorial: "Italiana-Regular.ttf",
};

async function displayFont(pairing: FontPairing) {
  try {
    const data = await readFile(
      join(process.cwd(), "src/assets/fonts", OG_FONT_FILE[pairing]),
    );
    // One family name for every theme: the card only ever paints one face, so
    // the styles below need not know which.
    return [{ name: "OgDisplay", data, style: "normal" as const, weight: 400 as const }];
  } catch {
    // A missing file must not take the card down with it.
    return undefined;
  }
}

async function heroBytes(src: string | null | undefined): Promise<ArrayBuffer | null> {
  if (!src) return null;
  try {
    const url = src.startsWith("http") ? src : new URL(src, SITE_URL).toString();
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!OG_IMAGE_TYPES.includes(type)) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

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

  const [hero, fonts] = await Promise.all([
    heroBytes(invite?.heroImage),
    displayFont(theme.fonts),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          background: p.bg, color: p.ink,
          fontFamily: "OgDisplay",
        }}
      >
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero as unknown as string}
            width={456}
            height={size.height}
            style={{ objectFit: "cover" }}
            alt=""
          />
        ) : null}
        <div
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{ width: 90, height: 1, background: p.rule, marginBottom: 36 }} />
          <div style={{ fontSize: hero ? 76 : 92, color: p.accent }}>{names}</div>
          {when ? (
            <div style={{ fontSize: 30, marginTop: 26, letterSpacing: 8, color: p.muted }}>
              {when}
            </div>
          ) : null}
          <div style={{ width: 90, height: 1, background: p.rule, marginTop: 36 }} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
