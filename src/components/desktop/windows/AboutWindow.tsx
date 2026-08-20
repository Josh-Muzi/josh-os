import { profile } from "@/content";

/** About Me as a real Notepad: an editable textarea, nothing persists. */
export function AboutWindow() {
  const text = profile.aboutParagraphs.join("\n\n");
  return (
    <textarea
      defaultValue={text}
      aria-label="About Josh Muzi"
      className="h-full w-full resize-none"
      style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 }}
    />
  );
}
