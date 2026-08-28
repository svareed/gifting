"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_NAMES } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";

export function NewInvite({
  label, blankLabel, defaultLocale, quotaLabel,
}: {
  label: string;
  /** Second path for people who would rather not edit someone else's words. */
  blankLabel: string;
  /** Someone reading in German most likely wants a German invitation. */
  defaultLocale: Locale;
  /** Shown when the plan is full, rather than a button that quietly does nothing. */
  quotaLabel: string;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(false);

  async function create(blank: boolean) {
    setBusy(true);
    setFull(false);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, blank }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 402) {
        setFull(true);
        setBusy(false);
        return;
      }
      if (data?.invite?.id) router.push(`/edit/${data.invite.id}`);
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div>
    <div className="row">
      <select className="select" style={{ width: "auto" }} value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}>
        {LOCALES.map((l) => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
      <button className="cta" onClick={() => create(false)} disabled={busy}>{label}</button>
      <button type="button" className="b-linkbtn" onClick={() => create(true)} disabled={busy}>
        {blankLabel}
      </button>
    </div>
    {full && (
      <p className="b-missing" style={{ marginTop: ".6rem" }}>
        {quotaLabel} <a className="b-linkbtn" href="/dashboard/organisation">→</a>
      </p>
    )}
    </div>
  );
}
