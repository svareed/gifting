"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Deleting takes the responses with it, so the confirmation says so rather
 * than asking "are you sure?" about an unnamed consequence. The server checks
 * ownership again; this is only the gesture.
 */
export function DeleteInvite({
  id, label, busyLabel, confirm,
}: {
  id: string;
  label: string;
  busyLabel: string;
  confirm: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(confirm)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invite/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="cta cta-ghost cta-danger"
            onClick={remove} disabled={busy}>
      {busy ? `${busyLabel}…` : label}
    </button>
  );
}
