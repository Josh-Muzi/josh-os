import {
  contactLinks,
  experience,
  formatJobDates,
  profile,
  skills,
} from "@/content";
import { buttonClasses, Panel } from "./Panel";

export function ResumeWindow() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {profile.name} — {profile.title}
        </p>
        <button
          type="button"
          className={buttonClasses}
          onClick={() => window.open("/resume.pdf", "_blank")}
        >
          Download PDF
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        {profile.location} ·{" "}
        {contactLinks.map((link) => link.value).join(" · ")}
      </p>
      <Panel title="Experience">
        {experience.map((job) => (
          <div key={`${job.company}-${job.start}`}>
            <p className="font-medium">
              {job.role}, {job.company} ({formatJobDates(job)})
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {job.highlights.slice(0, 3).map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        ))}
      </Panel>
      <Panel title="Education">
        <p className="font-medium">{profile.education.school}</p>
        <p>{profile.education.degree}</p>
        {profile.education.minors && profile.education.minors.length > 0 && (
          <p>
            {profile.education.minors.length > 1 ? "Minors" : "Minor"}:{" "}
            {profile.education.minors.join(", ")}
          </p>
        )}
        <p className="text-xs text-neutral-500">{profile.education.years}</p>
      </Panel>
      <Panel title="Skills">
        {skills.map((group) => (
          <p key={group.label}>
            <span className="font-medium">{group.label}:</span>{" "}
            {group.items.join(", ")}
          </p>
        ))}
      </Panel>
    </div>
  );
}
