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
		// Internal codename (ADR-0026): replace with tenant branding before any
		// tenant-visible release.
		name: "Meridian Prototype (Internal)",
		short_name: "Meridian",
		start_url: "/",
		theme_color: "#000000",
	};
}
