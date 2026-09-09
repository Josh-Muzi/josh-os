import type { ComponentType } from "react";
import type { AppId } from "./apps";
import { AboutWindow } from "./windows/AboutWindow";
import { CompostWindow } from "./windows/CompostWindow";
import { ContactWindow } from "./windows/ContactWindow";
import { DerbyWindow } from "./windows/DerbyWindow";
import { ExperienceWindow } from "./windows/ExperienceWindow";
import { PondWindow } from "./windows/PondWindow";
import { ProjectsWindow } from "./windows/ProjectsWindow";
import { ResumeWindow } from "./windows/ResumeWindow";
import { SkillsWindow } from "./windows/SkillsWindow";

const WINDOW_CONTENT: Record<AppId, ComponentType> = {
  about: AboutWindow,
  projects: ProjectsWindow,
  experience: ExperienceWindow,
  skills: SkillsWindow,
  resume: ResumeWindow,
  contact: ContactWindow,
  compost: CompostWindow,
  pond: PondWindow,
  derby: DerbyWindow,
};

export function AppContent({ appId }: { appId: AppId }) {
  const WindowContent = WINDOW_CONTENT[appId];
  return <WindowContent />;
}
