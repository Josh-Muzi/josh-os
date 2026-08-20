import { experience, formatJobDates } from "@/content";
import { linkClasses, Panel } from "./Panel";

export function ExperienceWindow() {
  return (
    <div className="space-y-3">
      {experience.map((job) => (
        <Panel
          key={`${job.company}-${job.start}`}
          title={`${job.role} — ${job.company}`}
        >
          <p className="text-xs text-neutral-500">
            {formatJobDates(job)} · {job.location}
            {job.companyUrl && (
              <>
                {" · "}
                <a
                  href={job.companyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClasses}
                >
                  {job.companyUrl.replace("https://", "")}
                </a>
              </>
            )}
          </p>
          {job.summary && <p>{job.summary}</p>}
          <ul className="list-disc space-y-1 pl-5">
            {job.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          {job.stack && (
            <p className="text-xs text-neutral-500">{job.stack.join(" · ")}</p>
          )}
        </Panel>
      ))}
    </div>
  );
}
