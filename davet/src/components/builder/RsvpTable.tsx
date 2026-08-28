"use client";
import type { Rsvp } from "@/lib/types";

/** Client-side CSV so the couple can take their guest list elsewhere. */
export function ExportCsv({ rows, filename }: { rows: Rsvp[]; filename: string }) {
  function download() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      ["name", "attending", "guests", "message", "received"].join(","),
      ...rows.map((r) =>
        [
          esc(r.name),
          r.attending ? "yes" : "no",
          String(r.guestCount),
          esc(r.message),
          r.createdAt,
        ].join(","),
      ),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return <button className="cta cta-ghost" onClick={download}>CSV</button>;
}
