import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { THEME_COLOR, THEME_KEY } from "@/components/site/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Canonical origin for share previews and absolute URLs.
  metadataBase: new URL("https://joshmuzi.com"),
  title: "Josh Muzi - Software Engineer",
  description:
    "Software engineer in Orange County building web apps with TypeScript, React, and Next.js — plus AI-powered games you can play right on the desktop.",
  openGraph: {
    title: "Josh Muzi - Software Engineer",
    description:
      "JoshOS: a Windows 95-style desktop that happens to be my portfolio.",
    siteName: "JoshOS",
    type: "website",
  },
};

export const viewport: Viewport = {
  // Updated by the theme script/toggle so the browser chrome matches.
  themeColor: THEME_COLOR.light,
};

// Runs while the HTML is parsed, before first paint: applies the stored
// theme (or the OS preference) so a dark-mode visitor never sees a white
// flash. Shares its key and colors with the toggle via theme.ts.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?${JSON.stringify(THEME_COLOR.dark)}:${JSON.stringify(THEME_COLOR.light)})}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      // The inline script rewrites data-theme before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, first-party script with no user input */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
