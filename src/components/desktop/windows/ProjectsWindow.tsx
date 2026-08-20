import { projects } from "@/content";
import { FolderIcon } from "../icons";

const linkClasses = "text-[#000080] underline";

export function ProjectsWindow() {
  return (
    <div className="space-y-3">
      <p className="text-xs">{projects.length} object(s)</p>
      {projects.map((project) => (
        <fieldset key={project.slug}>
          <legend className="flex items-center gap-1.5">
            <FolderIcon size={16} />
            {project.name}
          </legend>
          <p className="font-bold">{project.tagline}</p>
          {project.description.map((paragraph) => (
            <p key={paragraph} className="mt-2">
              {paragraph}
            </p>
          ))}
          <p className="mt-2">Stack: {project.stack.join(", ")}</p>
          <p className="mt-2 flex flex-wrap items-center gap-3">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className={linkClasses}
              >
                View source on GitHub
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className={linkClasses}
              >
                Visit live site
              </a>
            )}
            <span className="text-xs">[{project.status}]</span>
          </p>
        </fieldset>
      ))}
    </div>
  );
}
