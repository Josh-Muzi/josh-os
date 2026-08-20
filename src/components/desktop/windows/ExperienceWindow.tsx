import { experience, formatJobDates } from "@/content";

export function ExperienceWindow() {
  return (
    <div className="space-y-4">
      {experience.map((job) => (
        <fieldset key={`${job.company}-${job.start}`}>
          <legend>
            {job.role} — {job.company}
          </legend>
          <p className="text-xs">
            {formatJobDates(job)} · {job.location}
            {job.companyUrl && (
              <>
                {" · "}
                <a
                  href={job.companyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#000080] underline"
                >
                  {job.companyUrl.replace("https://", "")}
                </a>
              </>
            )}
          </p>
          {job.summary && <p className="mt-2">{job.summary}</p>}
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {job.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          {job.stack && <p className="mt-2">Stack: {job.stack.join(", ")}</p>}
        </fieldset>
      ))}
    </div>
  );
}
