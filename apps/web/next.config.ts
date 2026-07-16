import "@meridian/tooling-env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	output: "standalone",
	reactCompiler: true,
	typedRoutes: true,
};

export default nextConfig;
