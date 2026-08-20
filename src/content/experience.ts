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
      "Contributed across the full stack: frontend features, backend services, authentication flows, third-party integrations, and internal tooling.",
      "Diagnosed and resolved server-side performance issues by redesigning feature flag evaluation to eliminate redundant processing.",
      "Built an automated data-import pipeline with provider failover, retry logic, and multi-layer deduplication to prevent duplicate records.",
      "Integrated data-import workflows with internal operations tools, including live progress tracking and automated completion notifications.",
      "Implemented product analytics with Google Tag Manager and GA4, including conversion funnels and custom scroll-depth tracking.",
      "Improved search indexing and sharing through JSON-LD structured data, dynamic sitemaps, robots.txt, and automated Open Graph image generation.",
    ],
    stack: ["Next.js 15", "TypeScript", "Convex", "WorkOS", "Vercel"],
  },
  {
    company: "Delta Tau Delta Fraternity",
    role: "Director of Finance",
    start: "Sept 2022",
    end: "May 2023",
    location: "Eugene, OR",
    highlights: [
      "Led financial management for an organization with a $450K annual budget, overseeing budget creation and financial planning across multiple committees.",
      "Streamlined monthly dues collection for 100+ members while maintaining accurate financial records and reporting.",
      "Managed 30+ chapter-house subleases as acting subtenant, overseeing lease agreements and day-to-day administrative operations.",
    ],
  },
  {
    company: "Muzi & Associates",
    role: "File Clerk",
    start: "2020",
    end: "2020",
    location: "Irvine, CA",
    highlights: [
      "Digitized and organized legal documents with a high level of accuracy, ensuring files were properly categorized and easily accessible.",
      "Cross-checked and verified records with multiple teams to maintain accurate and up-to-date documentation.",
      "Maintained efficient filing systems while consistently meeting deadlines and demonstrating strong organization and time management.",
    ],
  },
];
