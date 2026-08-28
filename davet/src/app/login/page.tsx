import { SUPABASE_CONFIGURED } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";
import { PRODUCT_NAME } from "@/lib/config";
import { messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import { LocaleSwitch } from "@/components/LocaleSwitch";

export default async function LoginPage() {
  const locale = await uiLocale();
  const m = messages(locale);

  return (
    <main className="page">
      <div className="page-bar">
        <LocaleSwitch value={locale} label={m.ui.language} />
      </div>
      <h1>{PRODUCT_NAME}</h1>
      {SUPABASE_CONFIGURED ? (
        <>
          <p className="lede">{m.login.lede}</p>
          <LoginForm
            emailLabel={m.login.email}
            send={m.login.send}
            sending={m.login.sending}
            sent={m.login.sent}
            failed={m.login.failed}
          />
        </>
      ) : (
        <>
          <p className="lede">{m.login.demoLede}</p>
          <p style={{ marginTop: "1.5rem" }}>
            <a className="cta" href="/dashboard">{m.login.continue}</a>
          </p>
        </>
      )}
    </main>
  );
}
