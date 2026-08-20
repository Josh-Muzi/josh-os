import type { ReactNode } from "react";

/** Modern replacement for the old 98.css fieldsets inside windows. */
export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export const linkClasses =
  "text-emerald-700 underline underline-offset-2 hover:text-emerald-800";

export const buttonClasses =
  "rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50";
