import { profile } from "@/content";
import type { AppId } from "./apps";

/** Window contents. Placeholder-level for Phase 3; Phase 4 makes these real. */
export function AppContent({ appId }: { appId: AppId }) {
  if (appId === "about") {
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        {profile.aboutParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    );
  }
  return (
    <p className="text-sm">
      Under construction — this window gets its real content in Phase 4.
    </p>
  );
}
