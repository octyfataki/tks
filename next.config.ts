import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.TKS_TURBOPACK_ROOT
    ? { turbopack: { root: process.env.TKS_TURBOPACK_ROOT } }
    : {}),
};

export default nextConfig;
