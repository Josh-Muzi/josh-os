import type { ReactNode } from "react";
import {
  experience,
  formatJobDates,
  profile,
  projects,
  skills,
} from "@/content";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function AboutSection() {
  return (
    <Section id="about" title="About">
      {profile.aboutParagraphs.map((paragraph) => (
        <p key={paragraph} className="leading-relaxed text-neutral-700">
          {paragraph}
        </p>
      ))}
    </Section>
  );
}

export function ExperienceSection() {
  return (
    <Section id="experience" title="Experience">
      {experience.map((job) => (
        <article key={`${job.company}-${job.start}`}>
          <h3 className="font-semibold">
            {job.role} ·{" "}
            {job.companyUrl ? (
              <a
                href={job.companyUrl}
                className="text-emerald-700 underline-offset-4 hover:underline"
              >
                {job.company}
              </a>
            ) : (
              job.company
            )}
          </h3>
          <p className="text-sm text-neutral-500">
            {formatJobDates(job)} · {job.location}
          </p>
          {job.summary && (
            <p className="mt-2 text-neutral-700">{job.summary}</p>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
            {job.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          {job.stack && (
            <p className="mt-2 text-sm text-neutral-500">
              {job.stack.join(" · ")}
            </p>
          )}
        </article>
      ))}
    </Section>
  );
}

export function ProjectsSection() {
  return (
    <Section id="projects" title="Projects">
      {projects.map((project) => (
        <article key={project.slug}>
          <h3 className="font-semibold">
            {project.name}
            {project.status === "in-progress" && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                in progress
              </span>
            )}
          </h3>
          <p className="mt-1 text-neutral-700">{project.tagline}</p>
          <div className="mt-2 space-y-2">
            {project.description.map((paragraph) => (
              <p key={paragraph} className="text-neutral-700">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            {project.stack.join(" · ")}
          </p>
          <p className="mt-2 text-sm">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                className="font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                Source on GitHub
              </a>
            )}
          </p>
        </article>
      ))}
    </Section>
  );
}

export function SkillsSection() {
  return (
    <Section id="skills" title="Skills">
      <dl className="space-y-3">
        {skills.map((group) => (
          <div key={group.label} className="sm:flex sm:gap-4">
            <dt className="w-40 shrink-0 font-medium">{group.label}</dt>
            <dd className="text-neutral-700">{group.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

export function EducationSection() {
  const { education } = profile;
  return (
    <Section id="education" title="Education">
      <article>
        <h3 className="font-semibold">{education.school}</h3>
        <p className="text-neutral-700">{education.degree}</p>
        {education.minors && education.minors.length > 0 && (
          <p className="text-neutral-700">
            {education.minors.length > 1 ? "Minors" : "Minor"}:{" "}
            {education.minors.join(", ")}
          </p>
        )}
        <p className="text-sm text-neutral-500">{education.years}</p>
      </article>
    </Section>
  );
}
