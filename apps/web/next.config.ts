import { env } from "@meridian/tooling-env/web";
import type { NextConfig } from "next";

const apiDestination = (
	env.PLATFORM_API_INTERNAL_URL ?? env.NEXT_PUBLIC_SERVER_URL
).replace(/\/$/u, "");

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	output: "standalone",
	reactCompiler: true,
	rewrites: () =>
		Promise.resolve([
			{
				destination: `${apiDestination}/api/auth/:path*`,
				source: "/api/auth/:path*",
			},
			{
				destination: `${apiDestination}/rpc/:path*`,
				source: "/rpc/:path*",
			},
		]),
	typedRoutes: true,
};

export default nextConfig;
