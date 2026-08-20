import type { ExperienceEntry } from "./types";

/** "Sept 2022 – May 2023", "Jan 2026 – Present", or just "2020". */
export function formatJobDates(job: ExperienceEntry): string {
  const end = job.end ?? "Present";
  return job.start === end ? job.start : `${job.start} – ${end}`;
}
