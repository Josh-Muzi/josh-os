import { projects } from "@/content";
import { FolderIcon } from "../icons";
import { linkClasses, Panel } from "./Panel";

export function ProjectsWindow() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400">{projects.length} object(s)</p>
      {projects.map((project) => (
        <Panel key={project.slug} title={project.name}>
          <p className="flex items-center gap-1.5 font-medium">
            <FolderIcon size={16} />
            {project.tagline}
          </p>
          {project.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="text-xs text-neutral-500">
            {project.stack.join(" · ")}
          </p>
          <p className="flex flex-wrap items-center gap-3">
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
            <span className="text-xs text-neutral-400">[{project.status}]</span>
          </p>
        </Panel>
      ))}
    </div>
  );
}
