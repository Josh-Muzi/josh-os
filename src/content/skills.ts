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
      "Redis (Upstash)",
      "Rate limiting and budget controls",
    ],
  },
  {
    label: "AI Engineering",
    items: [
      "Claude API (Anthropic)",
      "Prompt design with schema-validated (Zod) outputs",
      "Hybrid architectures: rules in code, LLM for creativity",
      "Graceful degradation and cost guardrails",
      "AI-assisted asset pipelines (pixel art, sprite sheets)",
    ],
  },
  {
    label: "Game & Simulation",
    items: [
      "Deterministic seeded simulation",
      "Monte Carlo odds pricing",
      "Procedural sprite generation",
      "Canvas rendering and CSS animation",
      "Game economy design",
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
