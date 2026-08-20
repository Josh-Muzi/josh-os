import { contactLinks } from "@/content";

export function ContactWindow() {
  return (
    <div className="space-y-2">
      <p>Say hi — I read everything:</p>
      <ul className="space-y-1">
        {contactLinks.map((link) => (
          <li key={link.href} className="flex items-baseline gap-2">
            <span className="w-16 shrink-0 font-bold">{link.label}:</span>
            <a
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
              className="break-all text-[#000080] underline"
            >
              {link.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
