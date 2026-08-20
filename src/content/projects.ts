import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "josh-os",
    name: "JoshOS (this site)",
    tagline: "A Windows 95-style desktop that happens to be my portfolio.",
    description: [
      "Custom window manager (React context + reducer) with focus, z-index, minimize, and maximize — plus draggable desktop icons. No UI framework: hand-built modern chrome, hand-drawn pixel icons, react-rnd for drag/resize.",
      "One typed content source renders as draggable windows on desktop and as a fast, accessible single page on phones.",
    ],
    stack: [
      "Next.js 16",
      "TypeScript",
      "React",
      "Tailwind",
      "react-rnd",
      "Vercel",
    ],
    repoUrl: "https://github.com/TinyXIV/josh-os",
    status: "in-progress",
  },
];
