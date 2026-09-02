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

  /* Inganta In-Memory Image Optimization don rage Vercel Fast Origin Transfer */
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // Ajiye amfani da hoto na tsawon shekara 1 a CDN
  },

  /* Saita Caching Headers a dukkan Assets don toshe Edge Requests marasa amfani */
  async headers() {
    return [
      {
        // Caching na dukkan static JS/CSS/Fonts na Next.js
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Caching na hotuna, icons, da static media
        source: "/(.*).(png|jpg|jpeg|gif|webp|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, must-revalidate",
          },
        ],
      },
      {
        // Tsaron API Routes don hana staled cache
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;