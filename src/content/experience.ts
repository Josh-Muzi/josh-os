import type { ExperienceEntry } from "./types";

export const experience: ExperienceEntry[] = [
  {
    company: "REFS Labs",
    companyUrl: "https://refs.me",
    role: "Software Engineer Intern",
    start: "Jan 2026",
    end: null,
    location: "Remote",
    summary: "Trust-and-reputation platform for the trading card community.",
    highlights: [
      "Shipped 17 PRs (11 merged to production) across the platform.",
      "Re-architected the feature flag system into a per-request snapshot via the Vercel Flags SDK, collapsing ~29 evaluations per render and eliminating millions of redundant analytics events.",
      "Built a three-provider failover import pipeline (RapidAPI → Apify → BrightData) with three-layer deduplication.",
      "Built an internal Airtable ops dashboard.",
      "Instrumented GTM/GA4 analytics: 24 events and conversion funnels.",
      "Shipped SEO structured data: JSON-LD, dynamic sitemaps, and Edge OG image generation.",
    ],
    stack: ["Next.js 15", "TypeScript", "Convex", "WorkOS", "Vercel"],
  },
];
