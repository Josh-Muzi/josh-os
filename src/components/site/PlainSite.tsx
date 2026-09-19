import { contactLinks, profile } from "@/content";
import { NoticeBanner } from "./NoticeBanner";
import {
  AboutSection,
  EducationSection,
  ExperienceSection,
  ProjectsSection,
  SkillsSection,
} from "./Sections";

export function PlainSite({ noticeLive }: { noticeLive: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-6 focus:rounded focus:bg-emerald-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header>
        <p className="text-sm font-medium tracking-widest text-emerald-700 uppercase">
          JoshOS
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          {profile.name}
        </h1>
        <p className="mt-1 text-lg text-neutral-600">
          {profile.title} · {profile.location}
          {profile.availability ? (
            // Own line on phones so a wrapped "·" never dangles.
            <>
              <span className="hidden sm:inline"> · </span>
              <span className="block sm:inline">{profile.availability}</span>
            </>
          ) : null}
        </p>
        <nav
          aria-label="Contact"
          className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm"
        >
          {contactLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-medium text-emerald-700 underline-offset-4 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>
        {profile.notice ? (
          <NoticeBanner notice={profile.notice} initiallyLive={noticeLive} />
        ) : null}
      </header>
      <main id="main" className="mt-12 space-y-12">
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
        <SkillsSection />
        <EducationSection />
      </main>
      <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} Josh Muzi</p>
      </footer>
    </div>
  );
}
