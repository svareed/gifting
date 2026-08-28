import { THEME_LIST } from "@/lib/themes";
import { SUPABASE_CONFIGURED } from "@/lib/db";
import { messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import { LocaleSwitch } from "@/components/LocaleSwitch";

export default async function Landing() {
  const locale = await uiLocale();
  const m = messages(locale);

  return (
    <main className="page">
      <div className="page-bar">
        <LocaleSwitch value={locale} label={m.ui.language} />
      </div>

      <h1>
        {m.landing.h1a}
        <br />
        {m.landing.h1b}
      </h1>
      <p className="lede">{m.landing.lede}</p>

      <div className="row" style={{ marginTop: "2rem" }}>
        <a className="cta" href="/dashboard">{m.landing.start}</a>
        <a className="cta cta-ghost" href="/amir-leyla">{m.landing.example}</a>
      </div>

      {!SUPABASE_CONFIGURED && (
        <p className="b-missing" style={{ marginTop: "1.5rem" }}>{m.landing.demo}</p>
      )}

      <h2 style={{ marginTop: "4rem" }}>{m.landing.stylesHeading}</h2>
      <p className="lede">{m.landing.stylesLede}</p>

      <div className="showcase">
        {THEME_LIST.map((t) => (
          <div className="showcase-card" key={t.id}>
            <div className="showcase-band"
                 style={{ background: t.palette.bg, color: t.palette.accent }}>
              A &amp; L
            </div>
            <div className="showcase-meta">
              <strong>{m.ui.themes[t.id].name}</strong>
              <span>{m.ui.themes[t.id].blurb}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
