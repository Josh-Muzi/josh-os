import {
  contactLinks,
  experience,
  formatJobDates,
  profile,
  skills,
} from "@/content";

export function ResumeWindow() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">
          {profile.name} — {profile.title}
        </p>
        <button
          type="button"
          onClick={() => window.open("/resume.pdf", "_blank")}
        >
          Download PDF
        </button>
      </div>
      <p className="text-xs">
        {profile.location} ·{" "}
        {contactLinks.map((link) => link.value).join(" · ")}
      </p>
      <fieldset>
        <legend>Experience</legend>
        <div className="space-y-3">
          {experience.map((job) => (
            <div key={`${job.company}-${job.start}`}>
              <p className="font-bold">
                {job.role}, {job.company} ({formatJobDates(job)})
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {job.highlights.slice(0, 3).map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Education</legend>
        <p className="font-bold">{profile.education.school}</p>
        <p>{profile.education.degree}</p>
        {profile.education.minors && profile.education.minors.length > 0 && (
          <p>
            {profile.education.minors.length > 1 ? "Minors" : "Minor"}:{" "}
            {profile.education.minors.join(", ")}
          </p>
        )}
        <p className="text-xs">{profile.education.years}</p>
      </fieldset>
      <fieldset>
        <legend>Skills</legend>
        {skills.map((group) => (
          <p key={group.label}>
            <span className="font-bold">{group.label}:</span>{" "}
            {group.items.join(", ")}
          </p>
        ))}
      </fieldset>
    </div>
  );
}
