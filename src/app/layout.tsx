import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  // CONFIRM at deploy: assumes the Vercel project is named josh-os.
  metadataBase: new URL("https://josh-os.vercel.app"),
  title: "Josh Muzi — Software Engineer",
  description:
    "Software engineer in Orange County building web apps with TypeScript, React, and Next.js — plus AI-powered games you can play right on the desktop.",
  openGraph: {
    title: "Josh Muzi — Software Engineer",
    description:
      "JoshOS: a Windows 95-style desktop that happens to be my portfolio.",
    siteName: "JoshOS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
