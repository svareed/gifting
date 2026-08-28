import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { store } from "@/lib/db";
import { Invite } from "@/components/invite/Invite";
import { formatShortDate } from "@/lib/datetime";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const invite = await (await store()).getPublishedBySlug(slug);
  if (!invite) return { title: "Not found" };

  const names = `${invite.partnerAName} & ${invite.partnerBName}`;
  const when = invite.events[0]
    ? formatShortDate(invite.events[0].startsAt, invite.locale, invite.timezone)
    : "";

  // Most guests arrive through a WhatsApp link preview, so this is the door.
  return {
    title: when ? `${names} | ${when}` : names,
    description: invite.events[0]?.venueAddress ?? "",
    openGraph: { title: names, description: when, type: "website" },
  };
}

export default async function InvitePage({
  params, searchParams,
}: Params & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const db = await store();
  const invite = await db.getPublishedBySlug(slug);
  if (!invite) notFound();

  // ?g=<token> identifies one household. An unknown token is simply ignored:
  // the invitation still opens, it just falls back to the open RSVP form.
  const raw = (await searchParams).g;
  const token = typeof raw === "string" ? raw : null;
  const guest = token ? await db.getGuestByToken(invite.id, token) : null;

  return (
    <Invite
      invite={invite}
      live
      household={guest ? { token: guest.token, name: guest.household, seats: guest.seats } : null}
    />
  );
}
