import { notFound, redirect } from "next/navigation";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import { ExportCsv } from "@/components/builder/RsvpTable";
import { GuestList } from "@/components/builder/GuestList";
import { RemindersPanel, type DueRow } from "@/components/builder/RemindersPanel";
import { SITE_URL } from "@/lib/config";
import { guestLink } from "@/lib/guestToken";
import { reminderText, whatsappLink } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export default async function RsvpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await currentOwner();
  if (!owner) redirect("/login");

  const { id } = await params;
  const db = await store();
  const invite = await db.getInvite(id, owner);
  if (!invite) notFound();

  const m = messages(await uiLocale());
  const [rows, totals, guests, due] = await Promise.all([
    db.listRsvps(id, owner),
    db.countRsvps(id, owner),
    db.listGuests(id, owner),
    db.remindersDue(new Date().toISOString()),
  ]);

  const repliedIds = rows.map((r) => r.guestId).filter((x): x is string => Boolean(x));

  // Only this invitation's reminders, rendered ready to send.
  const dueRows: DueRow[] = due
    .filter((d) => d.invite.id === id)
    .map((d) => {
      const text = reminderText(d, guestLink(SITE_URL, d.invite.slug, d.guest.token));
      return {
        guestId: d.guest.id,
        household: d.guest.household || d.guest.token,
        kind: d.kind,
        phone: d.guest.phone,
        email: d.guest.email,
        text,
        whatsapp: d.guest.phone ? whatsappLink(d.guest.phone, text) : null,
      };
    });

  return (
    <main className="page">
      <a className="b-back" href="/dashboard">← {m.b.dashboard}</a>
      <h1 style={{ marginTop: ".5rem" }}>{m.b.responses}</h1>
      <p className="lede">
        {totals.yes} · {totals.no} · {totals.guests} {m.rsvp.guests.toLowerCase()}
      </p>

      <div className="row" style={{ marginTop: "1rem" }}>
        <ExportCsv rows={rows} filename={`${invite.slug}-rsvps.csv`} />
      </div>

      {rows.length > 0 && (
        <div className="table-scroll" style={{ marginTop: "1.5rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>{m.rsvp.yourName}</th>
              <th>{m.b.responses}</th>
              <th>{m.rsvp.guests}</th>
              <th>{m.rsvp.message}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.attending ? m.rsvp.attending : m.rsvp.notAttending}</td>
                <td>{r.guestCount}</td>
                <td>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <h2 style={{ marginTop: "3rem" }}>{m.guests.heading}</h2>
      <GuestList inviteId={id} slug={invite.slug} siteUrl={SITE_URL}
                 initial={guests} repliedIds={repliedIds} m={m} />

      <h2 style={{ marginTop: "3rem" }}>{m.reminders.heading}</h2>
      <p className="lede">{m.reminders.lede}</p>
      <RemindersPanel rows={dueRows} m={m} />

    </main>
  );
}
