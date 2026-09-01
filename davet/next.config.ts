import type { NextConfig } from "next";

const config: NextConfig = {
  images: { formats: ["image/webp"] },
  // The OG route reads these with fs at request time, so tracing has to be
  // told about them or the share card silently falls back to a system sans in
  // production while looking correct locally.
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": ["./src/assets/fonts/**"],
  },
  // This deployment is one couple's invitation rather than the product, so the
  // bare domain is their gate instead of the theme gallery. Deliberately 307
  // and not 308: browsers cache a permanent redirect hard, and a demo that
  // later wants its own homepage back should not need every guest to clear it.
  async redirects() {
    return [{ source: "/", destination: "/max-und-lena", permanent: false }];
  },
};

export default config;
