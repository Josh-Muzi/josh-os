import { skills } from "@/content";

export function SkillsWindow() {
  return (
    <div className="space-y-3">
      {skills.map((group) => (
        <fieldset key={group.label}>
          <legend>{group.label}</legend>
          <p>{group.items.join(", ")}</p>
        </fieldset>
      ))}
    </div>
  );
}
