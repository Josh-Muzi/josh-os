import type { SkillGroup } from "./types";

export const skills: SkillGroup[] = [
  {
    label: "Languages",
    items: [
      "TypeScript",
      "JavaScript",
      "Python",
      "C++",
      "SQL",
      "Shell scripting",
    ],
  },
  {
    label: "Frontend",
    items: ["React", "Next.js (App Router)", "Tailwind CSS", "HTML/CSS"],
  },
  {
    label: "Backend & Data",
    items: [
      "Node.js",
      "Convex",
      "REST APIs",
      "MongoDB",
      "OAuth 2.0 and auth integration",
      "Webhooks",
    ],
  },
  {
    label: "Tools & Practices",
    items: [
      "GitHub",
      "Vercel",
      "CI and pre-push pipelines",
      "Biome",
      "pnpm",
      "Linux",
      "Agile",
      "Code review",
    ],
  },
  {
    label: "Soft Skills",
    items: [
      "Project Management",
      "Leadership",
      "Teamwork",
      "Organization",
      "Creative Thinking",
    ],
  },
];
