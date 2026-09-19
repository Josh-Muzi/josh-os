// Shared content types. One typed content source feeds both the
// boring-mode page and the desktop windows (PostHog-style content-as-data).

/**
 * A short, time-boxed announcement: a banner in boring mode and a pinned
 * note on the desktop. See `isNoticeLive` for when it shows.
 */
export interface Notice {
  /** Manual off switch; the slot stays in the file for the next announcement. */
  enabled: boolean;
  /** Short heading for the desktop note, e.g. "In SF · Sept 19–22". */
  label: string;
  text: string;
  cta?: { label: string; href: string };
  /**
   * Absolute end time, ISO 8601 WITH a UTC offset, e.g.
   * "2026-09-26T23:59:59-07:00". The notice disables itself after this.
   */
  expires: string;
}

export interface Profile {
  name: string;
  title: string;
  location: string;
  /** Short status shown after the location in the boring-mode header. */
  availability?: string;
  /** Optional announcement slot. Self-disables after `notice.expires`. */
  notice?: Notice;
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
  summary?: string;
  highlights: string[];
  stack?: string[];
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
