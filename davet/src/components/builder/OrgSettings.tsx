"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Text } from "./Fields";
import { Wordmark } from "@/components/Wordmark";
import type { Messages } from "@/lib/i18n";
import type { Organization } from "@/lib/types";

export function OrgSettings({
  org, m, hostSuffix,
}: {
  org: Organization;
  m: Messages;
  /**
   * "davet.de", the address is built here rather than passed as a callback,
   * because a function cannot cross the server-to-client boundary.
   */
  hostSuffix: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(org);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Organization>(k: K, v: Organization[K]) => {
    setDraft((p) => ({ ...p, [k]: v }));
    setState("idle");
  };

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: draft.name, slug: draft.slug, logoUrl: draft.logoUrl,
          website: draft.website, phone: draft.phone,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setState("error");
        setError(body?.error ?? "save_failed");
        return;
      }
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
      setError("save_failed");
    }
  }

  return (
    <div style={{ maxWidth: "32rem" }}>
      <div className="org-head">
        <Wordmark name={draft.name} logoUrl={draft.logoUrl} size={48} />
        <strong>{draft.name}</strong>
      </div>

      <Text label={m.org.name} value={draft.name} onChange={(v) => set("name", v)} />
      <Text label={m.org.address} value={draft.slug} inputMode="url"
            onChange={(v) => set("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
      <p className="note" style={{ marginTop: "-.75rem", marginBottom: "1rem" }}>
        {`https://${draft.slug || "…"}.${hostSuffix}`}
      </p>

      <Text label={m.org.logo} value={draft.logoUrl} inputMode="url"
            onChange={(v) => set("logoUrl", v)} />
      <Text label={m.org.website} value={draft.website} inputMode="url"
            onChange={(v) => set("website", v)} />
      <Text label={m.org.phone} value={draft.phone} inputMode="tel"
            onChange={(v) => set("phone", v)} />

      <div className="row" style={{ marginTop: "1rem" }}>
        <button className="cta" onClick={save} disabled={state === "saving"}>
          {state === "saving" ? `${m.b.saving}…` : m.org.save}
        </button>
        {state === "saved" && <span className="note">{m.org.saved}</span>}
        {error && <span className="b-missing">{error}</span>}
      </div>
    </div>
  );
}
