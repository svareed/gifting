import { redirect } from "next/navigation";
import { currentOwner } from "@/lib/auth";
import { orgFor, hostSuffix } from "@/lib/org";
import { store } from "@/lib/db";
import { messages } from "@/lib/i18n";
import { uiLocale } from "@/lib/uiLocale";
import { SITE_URL } from "@/lib/config";
import { PLAN_QUOTA } from "@/lib/types";
import { OrgSettings } from "@/components/builder/OrgSettings";

export const dynamic = "force-dynamic";

export default async function OrganisationPage() {
  const owner = await currentOwner();
  if (!owner) redirect("/login");

  const m = messages(await uiLocale());
  const org = await orgFor(owner);
  const used = await (await store()).countOrgInvites(org.id);
  const quota = PLAN_QUOTA[org.plan];

  return (
    <main className="page">
      <a className="b-back" href="/dashboard">← {m.b.dashboard}</a>
      <h1 style={{ marginTop: ".5rem" }}>{m.org.heading}</h1>
      <p className="lede">{m.org.lede}</p>

      <p className="note" style={{ marginTop: "1.25rem" }}>
        {m.org.plan}: <strong>{org.plan}</strong> · {m.org.quota}:{" "}
        <strong>{used}</strong>/{quota < 0 ? m.org.unlimited : quota}
      </p>

      <div style={{ marginTop: "2rem" }}>
        <OrgSettings org={org} m={m} hostSuffix={hostSuffix(SITE_URL)} />
      </div>
    </main>
  );
}
