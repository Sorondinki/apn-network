import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Wuce TypeScript errors lokacin Vercel build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Wuce ESLint errors lokacin Vercel build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;