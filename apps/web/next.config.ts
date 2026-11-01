import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // core ships raw typescript, next compiles it for us
  transpilePackages: ["@fineprint/core"],
};

export default nextConfig;