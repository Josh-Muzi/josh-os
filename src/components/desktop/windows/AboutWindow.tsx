import { profile } from "@/content";

/** About Me as a modern take on Notepad: editable, monospace, nothing persists. */
export function AboutWindow() {
  const text = profile.aboutParagraphs.join("\n\n");
  return (
    <textarea
      defaultValue={text}
      aria-label="About Josh Muzi"
      className="h-full w-full resize-none rounded-md border border-neutral-200 bg-white p-3 font-mono text-[13px] leading-relaxed text-neutral-800 focus:outline-emerald-600"
    />
  );
}
