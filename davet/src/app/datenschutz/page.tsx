import { LegalPage, legalMetadata } from "../legal";
import { privacy } from "@/lib/legal";

export const metadata = legalMetadata("Datenschutz");

export default function Page() {
  return <LegalPage load={privacy} />;
}
