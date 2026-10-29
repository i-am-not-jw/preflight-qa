import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright stays outside the Next bundle. Bundling it stops the browser from launching.
  serverExternalPackages: ["playwright"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
