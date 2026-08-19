// Shared content types. One typed content source feeds both the
// boring-mode page and the desktop windows (PostHog-style content-as-data).

export interface Profile {
  name: string;
  title: string;
  location: string;
  /** Rendered in the About window (Notepad) and the boring-mode hero. */
  aboutParagraphs: string[];
  education: {
    school: string;
    degree: string;
    minors?: string[];
    years: string;
  };
}

export interface ExperienceEntry {
  company: string;
  companyUrl?: string;
  role: string;
  start: string;
  /** null while the role is current. */
  end: string | null;
  location: string;
  summary: string;
  highlights: string[];
  stack: string[];
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string[];
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
  status: "live" | "in-progress";
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface ContactLink {
  label: string;
  value: string;
  href: string;
}
