import "@meridian/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	reactCompiler: true,
	transpilePackages: ["shiki"],
	typedRoutes: true,
};

export default nextConfig;
