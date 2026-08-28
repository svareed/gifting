import { EXAMPLE_VENUE } from "@/lib/brand";

/**
 * A venue's mark. Uses the uploaded logo when there is one and falls back to a
 * monogram drawn from the name, so an organisation always has something to
 * show without anyone having to produce an image file first.
 */
export function Wordmark({
  name, logoUrl, size = 40,
}: {
  name: string;
  logoUrl?: string;
  size?: number;
}) {
  if (logoUrl) {
    // Plain <img>: the URL is the venue's own, on a host we cannot know ahead
    // of time, so next/image's allowlist would reject it.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img className="wordmark-img" src={logoUrl} alt={name}
           style={{ height: size, width: "auto" }} />
    );
  }

  const initials = name.trim()
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : EXAMPLE_VENUE.monogram;

  return (
    <span className="wordmark" style={{ width: size, height: size, fontSize: size * 0.4 }}
          aria-hidden="true">
      {initials}
    </span>
  );
}
