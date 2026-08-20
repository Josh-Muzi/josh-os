import { contactLinks } from "@/content";
import { linkClasses } from "./Panel";

export function ContactWindow() {
  return (
    <div className="space-y-2">
      <p>Say hi — I read everything:</p>
      <ul className="space-y-1.5">
        {contactLinks.map((link) => (
          <li key={link.href} className="flex items-baseline gap-2">
            <span className="w-16 shrink-0 font-medium">{link.label}</span>
            <a
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
              className={`break-all ${linkClasses}`}
            >
              {link.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
