import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		background_color: "#ffffff",
		description: "Meridian controlled prototype",
		display: "standalone",
		icons: [
			{
				sizes: "192x192",
				src: "/favicon/web-app-manifest-192x192.png",
				type: "image/png",
			},
			{
				sizes: "512x512",
				src: "/favicon/web-app-manifest-512x512.png",
				type: "image/png",
			},
		],
		name: "meridian",
		short_name: "meridian",
		start_url: "/",
		theme_color: "#000000",
	};
}
