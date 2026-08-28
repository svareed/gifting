"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_NAMES, UI_LOCALE_COOKIE } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";

/**
 * Writes the cookie, then refreshes so the server re-renders every string on
 * the page in the new language. A client-side dictionary swap would leave the
 * server-rendered half — titles, metadata, the invitation itself — behind.
 */
export function LocaleSwitch({ value, label }: { value: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="locale-switch">
      <span className="sr-only">{label}</span>
      <select
        className="select"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          document.cookie =
            `${UI_LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
          startTransition(() => router.refresh());
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </label>
  );
}
