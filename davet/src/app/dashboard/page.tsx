import { redirect } from "next/navigation";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { Wordmark } from "@/components/Wordmark";
import { orgFor } from "@/lib/org";
import { PLAN_QUOTA } from "@/lib/types";
import { NewInvite } from "@/components/builder/NewInvite";
import { DeleteInvite } from "@/components/builder/DeleteInvite";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const owner = await currentOwner();
  if (!owner) redirect("/login");

  const db = await store();
  const invites = await db.listInvites(owner);
  // The interface language is the reader's own choice, not a property of
  // whichever invitation happens to sort first.
  const locale = await uiLocale();
  const m = messages(locale);
  const org = await orgFor(owner);
  const quota = PLAN_QUOTA[org.plan];

  const counts = await Promise.all(
    invites.map((i) => db.countRsvps(i.id, owner)),
  );

  return (
    <main className="page">
      <div className="page-bar">
        <a className="org-chip" href="/dashboard/organisation">
          <Wordmark name={org.name} logoUrl={org.logoUrl} size={28} />
          <span>{org.name}</span>
        </a>
        <LocaleSwitch value={locale} label={m.ui.language} />
      </div>

      <div className="dash-head">
        <h1>{m.b.dashboard}</h1>
        {invites.length > 0 && (
          <NewInvite label={m.b.newInvite} blankLabel={m.b.startBlank}
                     defaultLocale={locale} quotaLabel={m.org.quotaReached} />
        )}
      </div>

      <p className="note" style={{ marginTop: ".25rem" }}>
        {m.org.quota}: <strong>{invites.length}</strong>
        /{quota < 0 ? m.org.unlimited : quota}
      </p>

      {invites.length === 0 ? (
        // The first screen anyone sees after signing up. It says what happens
        // next instead of leaving them in front of an empty list.
        <div className="dash-empty">
          <h2>{m.b.emptyTitle}</h2>
          <p className="lede">{m.b.emptyBody}</p>
          <div style={{ marginTop: "1.5rem" }}>
            <NewInvite label={m.b.newInvite} blankLabel={m.b.startBlank}
                       defaultLocale={locale} quotaLabel={m.org.quotaReached} />
          </div>
        </div>
      ) : (
        <div className="list">
          {invites.map((invite, i) => (
            <div className="list-row" key={invite.id}>
              <div>
                <strong>{invite.partnerAName} &amp; {invite.partnerBName}</strong>
                <div style={{ fontSize: ".8rem", color: "var(--app-muted)" }}>
                  /{invite.slug} · {counts[i].yes} × {m.rsvp.attending.toLowerCase()} · {counts[i].guests} {m.rsvp.guests.toLowerCase()}
                </div>
              </div>
              <div className="row">
                <span className="pill">
                  {invite.status === "published" ? m.b.published : m.b.draft}
                </span>
                <a className="cta cta-ghost" href={`/edit/${invite.id}`}>{m.b.edit}</a>
                <a className="cta cta-ghost" href={`/dashboard/${invite.id}/rsvps`}>{m.b.responses}</a>
                <a className="cta cta-ghost"
                   href={invite.status === "published" ? `/${invite.slug}` : `/preview/${invite.id}`}>
                  {m.b.view}
                </a>
                <DeleteInvite id={invite.id} label={m.b.delete}
                              busyLabel={m.b.deleting} confirm={m.b.deleteConfirm} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
