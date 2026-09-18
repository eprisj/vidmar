import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/vidmar",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
