import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the user profile dir was
  // making Next infer C:\Users\Josh as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
