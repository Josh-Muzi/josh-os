export type AppId =
  | "about"
  | "projects"
  | "experience"
  | "skills"
  | "resume"
  | "contact";

export interface AppDefinition {
  id: AppId;
  /** Window title-bar text. */
  title: string;
  /** Desktop icon label. */
  label: string;
  /** Placeholder icon; the real pixel icon pack is a pending taste pick. */
  emoji: string;
  defaultSize: { width: number; height: number };
}

export const APPS: AppDefinition[] = [
  {
    id: "about",
    title: "About Me - Notepad",
    label: "About Me",
    emoji: "📝",
    defaultSize: { width: 480, height: 420 },
  },
  {
    id: "projects",
    title: "Projects",
    label: "Projects",
    emoji: "📁",
    defaultSize: { width: 560, height: 440 },
  },
  {
    id: "experience",
    title: "Experience",
    label: "Experience",
    emoji: "💼",
    defaultSize: { width: 560, height: 480 },
  },
  {
    id: "skills",
    title: "Skills",
    label: "Skills",
    emoji: "🧰",
    defaultSize: { width: 460, height: 380 },
  },
  {
    id: "resume",
    title: "Resume",
    label: "Resume",
    emoji: "📄",
    defaultSize: { width: 560, height: 520 },
  },
  {
    id: "contact",
    title: "Contact",
    label: "Contact",
    emoji: "✉️",
    defaultSize: { width: 420, height: 320 },
  },
];
