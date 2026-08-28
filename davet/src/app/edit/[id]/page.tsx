import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { store } from "@/lib/db";
import { currentOwner } from "@/lib/auth";
import { PRODUCT_NAME, SITE_URL } from "@/lib/config";
import { Builder } from "@/components/builder/Builder";
import { uiLocale } from "@/lib/uiLocale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const owner = await currentOwner();
  if (!owner) return { title: PRODUCT_NAME };
  const { id } = await params;
  const invite = await (await store()).getInvite(id, owner);
  if (!invite) return { title: PRODUCT_NAME };
  return {
    title: `${invite.partnerAName} & ${invite.partnerBName} · ${PRODUCT_NAME}`,
  };
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await currentOwner();
  if (!owner) redirect("/login");

  const { id } = await params;
  const invite = await (await store()).getInvite(id, owner);
  if (!invite) notFound();

  return <Builder initial={invite} siteUrl={SITE_URL} uiLocale={await uiLocale()} />;
}
