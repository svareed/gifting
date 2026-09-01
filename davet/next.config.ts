import type { NextConfig } from "next";

const config: NextConfig = {
  images: { formats: ["image/webp"] },
  // The OG route reads these with fs at request time, so tracing has to be
  // told about them or the share card silently falls back to a system sans in
  // production while looking correct locally.
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": ["./src/assets/fonts/**"],
  },
};

export default config;
