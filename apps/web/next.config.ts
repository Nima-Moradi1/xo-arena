import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@xo/shared"],
  images: {
    remotePatterns: [],
    unoptimized: true
  }
};

export default nextConfig;
