import type { Metadata } from "next";
import {
  Cormorant_Garamond, Cinzel, Playfair_Display, EB_Garamond, Italiana,
  Jost, Outfit, Amiri,
} from "next/font/google";
import { PRODUCT_NAME, SITE_URL } from "@/lib/config";
import { HTML_LANG, DEFAULT_LOCALE, messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import "./globals.css";

/**
 * Self-hosted at build time — no request reaches Google, which keeps the German
 * audience's invitations clear of the Google Fonts hotlinking problem.
 *
 * `preload: false` throughout: @font-face is lazy, so a visitor downloads only
 * the two or three faces their chosen theme actually paints, not all seven
 * families. next/font requires literal option objects, so these cannot share a
 * spread constant.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["400", "500", "600"], variable: "--f-cormorant",
});
const cinzel = Cinzel({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["400", "500"], variable: "--f-cinzel",
});
const playfair = Playfair_Display({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["400", "500"], variable: "--f-playfair",
});
const ebGaramond = EB_Garamond({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["400", "500"], variable: "--f-ebgaramond",
});
const italiana = Italiana({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["400"], variable: "--f-italiana",
});
const jost = Jost({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["300", "400", "500"], variable: "--f-jost",
});
const outfit = Outfit({
  subsets: ["latin"], display: "swap", preload: false,
  weight: ["300", "400", "500"], variable: "--f-outfit",
});
const amiri = Amiri({
  subsets: ["arabic"], display: "swap", preload: false,
  weight: ["400", "700"], variable: "--f-amiri",
});

const FONTS = [cormorant, cinzel, playfair, ebGaramond, italiana, jost, outfit, amiri]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  // Without this, OG image URLs resolve relative and WhatsApp shows no preview
  // — which is the path almost every guest actually arrives through.
  metadataBase: new URL(SITE_URL),
  title: PRODUCT_NAME,
  description: messages(DEFAULT_LOCALE).b.appTagline,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await uiLocale();
  return (
    <html lang={HTML_LANG[locale]} className={FONTS}>
      <body className="app">{children}</body>
    </html>
  );
}
