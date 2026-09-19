import type { ComponentType } from "react";
import {
  BriefcaseIcon,
  CompostBinIcon,
  DerbyIcon,
  FolderIcon,
  MailIcon,
  NotepadIcon,
  type PixelIconProps,
  PondIcon,
  ResumeIcon,
  ToolboxIcon,
} from "./icons";

export type AppId =
  | "about"
  | "projects"
  | "experience"
  | "skills"
  | "resume"
  | "contact"
  | "compost"
  | "pond"
  | "derby";

export interface AppDefinition {
  id: AppId;
  /** Window title-bar text. */
  title: string;
  /** Desktop icon label. */
  label: string;
  icon: ComponentType<PixelIconProps>;
  defaultSize: { width: number; height: number };
  /** Defaults to true; the Compost Bin lives on the desktop only. */
  inStartMenu?: boolean;
  /** Desktop icon column (0 = portfolio, 1 = games). Defaults to 0. */
  desktopColumn?: number;
  /** Take the cell right of this app's icon instead of a column slot (see iconGrid). */
  desktopBeside?: AppId;
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
    // The bottom-left of the wallpaper (stepping stones) swallows a label,
    // so Contact lives right of Resume, over open grass.
    desktopBeside: "resume",
  },
  {
    id: "compost",
    title: "Compost Bin",
    label: "Compost Bin",
    icon: CompostBinIcon,
    defaultSize: { width: 420, height: 300 },
    inStartMenu: false,
  },
  {
    id: "pond",
    title: "POND.EXE",
    label: "POND.EXE",
    icon: PondIcon,
    defaultSize: { width: 560, height: 560 },
    desktopColumn: 1,
  },
  {
    id: "derby",
    title: "DERBY.EXE",
    label: "DERBY.EXE",
    icon: DerbyIcon,
    defaultSize: { width: 720, height: 720 },
    desktopColumn: 1,
  },
];
