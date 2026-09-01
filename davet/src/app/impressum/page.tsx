import { LegalPage, legalMetadata } from "../legal";
import { imprint } from "@/lib/legal";

export const metadata = legalMetadata("Impressum");

export default function Page() {
  return <LegalPage load={imprint} />;
}
