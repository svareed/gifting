"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function LoginForm({
  emailLabel, send, sending, sent, failed,
}: {
  emailLabel: string;
  send: string;
  sending: string;
  sent: string;
  failed: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setState(error ? "error" : "sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return <p className="lede">{sent}</p>;

  return (
    <form onSubmit={submit} style={{ marginTop: "1.5rem", maxWidth: "22rem" }}>
      <label className="field">
        <span className="label">{emailLabel}</span>
        <input className="input" type="email" required autoComplete="email"
               value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button className="cta" disabled={state === "sending"}>
        {state === "sending" ? `${sending}…` : send}
      </button>
      {state === "error" && (
        <p className="b-missing" style={{ marginTop: ".75rem" }}>{failed}</p>
      )}
    </form>
  );
}
