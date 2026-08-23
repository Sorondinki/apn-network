// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Kashe Source Maps a Browser domin kare Lambobin Kododinki (Source Code) daga DevTools */
  productionBrowserSourceMaps: false,

  /* Saka takunkumi kan bayyana sabar (Server Header Security) */
  poweredByHeader: false,

  /* Inganta Next.js Compiler domin minification da cire console.log a Production */
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  /* Bada damar gina aiki koda akwai kuskuren TypeScript */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;