import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://voice-under-scrutiny.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/community`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/history`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
