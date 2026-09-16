import { contactLinks } from "@/content";
import { linkClasses } from "./Panel";

export function ContactWindow() {
  return (
    <div className="space-y-2">
      <p>Feel free to reach out, I'd love to connect:</p>
      <ul className="space-y-1.5">
        {contactLinks.map((link) => {
          // mailto: and tel: hand off to the OS; only web links open a tab.
          const isHandoff = /^(mailto|tel):/.test(link.href);
          return (
            <li key={link.href} className="flex items-baseline gap-2">
              <span className="w-16 shrink-0 font-medium">{link.label}</span>
              <a
                href={link.href}
                target={isHandoff ? undefined : "_blank"}
                rel={isHandoff ? undefined : "noreferrer"}
                className={`break-all ${linkClasses}`}
              >
                {link.value}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
