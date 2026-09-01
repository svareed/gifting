import Link from "next/link";
import type { Metadata } from "next";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { OPERATOR_INCOMPLETE } from "@/lib/config";
import { messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import type { LegalDoc, Locale } from "@/lib/legal-types";

/**
 * Both legal documents render the same way, so the page shell lives here and
 * the two routes only choose which document to pass in.
 */
export async function LegalPage({
  load,
}: {
  load: (locale: Locale) => LegalDoc;
}) {
  const locale = await uiLocale();
  const m = messages(locale);
  const doc = load(locale);

  return (
    <main className="page legal">
      <div className="page-bar">
        <LocaleSwitch value={locale} label={m.ui.language} />
      </div>

      <h1>{doc.title}</h1>

      {/* Visible on purpose. A published Impressum that still holds bracketed
          placeholders is worse than an obviously unfinished one, because only
          the second kind gets fixed before it is sent to anybody. */}
      {OPERATOR_INCOMPLETE && (
        <p className="legal-todo">{m.legal.placeholderWarning}</p>
      )}

      {doc.sections.map((s) => (
        <section key={s.heading} className="legal-section">
          <h2>{s.heading}</h2>
          {s.body.map((line, i) => (
            <p key={i} className="legal-body">{line}</p>
          ))}
        </section>
      ))}

      <p className="legal-updated">{m.legal.updated} {doc.updated}</p>
      <p className="legal-back"><Link href="/">{m.legal.backHome}</Link></p>
    </main>
  );
}

export function legalMetadata(title: string): Metadata {
  // Legal pages carry no marketing value and should never rank above the app.
  return { title, robots: { index: false, follow: true } };
}
