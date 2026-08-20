import { skills } from "@/content";
import { Panel } from "./Panel";

export function SkillsWindow() {
  return (
    <div className="space-y-3">
      {skills.map((group) => (
        <Panel key={group.label} title={group.label}>
          <p>{group.items.join(", ")}</p>
        </Panel>
      ))}
    </div>
  );
}
