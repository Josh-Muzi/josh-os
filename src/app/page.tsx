import { Experience } from "@/components/Experience";
import { isNoticeLive, profile } from "@/content";

// Regenerate hourly so the static HTML drops an expired notice on its own
// (no redeploy, no stale announcement for crawlers or a flash for visitors).
export const revalidate = 3600;

export default function Home() {
  return <Experience noticeLive={isNoticeLive(profile.notice, new Date())} />;
}
