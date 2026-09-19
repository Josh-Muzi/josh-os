import { Experience } from "@/components/Experience";
import { isNoticeLive, profile } from "@/content";

// Regenerate hourly so the static HTML drops an expired notice on its own
// (no redeploy). ISR keeps serving the cached page until the first request
// after the hour, so in that window a visitor can briefly see the banner
// before the client-side check (useNoticeLive) hides it.
export const revalidate = 3600;

export default function Home() {
  return <Experience noticeLive={isNoticeLive(profile.notice, new Date())} />;
}
