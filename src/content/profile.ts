import type { Profile } from "./types";

export const profile: Profile = {
  name: "Josh Muzi",
  title: "Software Engineer",
  location: "Orange County, CA",
  availability: "Open to relocation",
  // Reusable announcement slot (boring-mode banner + desktop pinned note).
  // It switches itself off after `expires`, so it's safe to leave in place.
  // To reuse: edit label/text/cta, set a new `expires` (keep the UTC offset),
  // and keep `enabled: true`.
  // To switch it off early: set `enabled: false`.
  notice: {
    enabled: true,
    label: "In SF · Sept 19–22",
    text: "I'm in San Francisco Sept 19–22. If you'd like to connect, I'd love to grab coffee.",
    cta: {
      label: "Email me",
      // Prefilled subject lowers the effort to reach out; keep it URL-encoded.
      href: "mailto:jmuzi04@gmail.com?subject=Coffee%20in%20SF%3F",
    },
    // End of Sept 26, Pacific time.
    expires: "2026-09-26T23:59:59-07:00",
  },
  aboutParagraphs: [
    "Hello, I'm Josh, a software engineer in Orange County, California. I build web apps with TypeScript, React, and Next.js, previously at REFS Labs, where I worked on and shipped production level code for a trust-and-reputation platform for the trading card community. I'm currently looking for my next software engineering role and am open to relocating.",
    "I studied computer science at the University of Oregon (B.S., 2025) with a minor in Business & Entrepreneurship.",
    "Off the clock I run my own backyard salsa garden with serrano and jalapeño peppers, tomatillos, cherry and Roma tomatoes, cilantro, onions, and strawberries. I'm now about six months into a turf war with the neighborhood squirrels, every plant now lives in a metal cage but continues to thrive.",
    "Another hobby of mine is collecting and competitively playing in trading card games like Pokémon, One Piece, and Azuki for the last couple of years. One which I excel in is a newer trading card game called Azuki, where I sit top 30 on the overall winners leaderboard and placed 52nd of 315 at the first Garden Arena Regionals tournament in Los Angeles, CA.",
    "This site is my desk and sneak peek into who I am. My vision for this site is to create a place where I can showcase my work and share my interests while also being a site that I'd enjoy using and hopefully others too. Click around, open some windows, play some games and if something looks a little retro, that's on purpose.",
  ],
  education: {
    school: "University of Oregon",
    degree: "B.S. Computer Science",
    minors: ["Business & Entrepreneurship"],
    years: "2020–2025",
  },
};
