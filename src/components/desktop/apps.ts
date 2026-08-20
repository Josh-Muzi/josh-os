import type { ComponentType } from "react";
import {
  BriefcaseIcon,
  FolderIcon,
  MailIcon,
  NotepadIcon,
  type PixelIconProps,
  ResumeIcon,
  ToolboxIcon,
} from "./icons";

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
  icon: ComponentType<PixelIconProps>;
  defaultSize: { width: number; height: number };
}

export const APPS: AppDefinition[] = [
  {
    id: "about",
    title: "About Me - Notepad",
    label: "About Me",
    icon: NotepadIcon,
    defaultSize: { width: 480, height: 420 },
  },
  {
    id: "projects",
    title: "Projects",
    label: "Projects",
    icon: FolderIcon,
    defaultSize: { width: 560, height: 440 },
  },
  {
    id: "experience",
    title: "Experience",
    label: "Experience",
    icon: BriefcaseIcon,
    defaultSize: { width: 560, height: 480 },
  },
  {
    id: "skills",
    title: "Skills",
    label: "Skills",
    icon: ToolboxIcon,
    defaultSize: { width: 460, height: 380 },
  },
  {
    id: "resume",
    title: "Resume",
    label: "Resume",
    icon: ResumeIcon,
    defaultSize: { width: 560, height: 520 },
  },
  {
    id: "contact",
    title: "Contact",
    label: "Contact",
    icon: MailIcon,
    defaultSize: { width: 420, height: 320 },
  },
];
