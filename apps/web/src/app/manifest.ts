import type { MetadataRoute } from "next";

// Web-manifest fields require literal colors. These two literals are a
// recorded white-label seam (fifth-audit F-H-007): replace per tenant brand
// when white-label packaging lands; registry/design-tokens.json remains the
// governed source for in-app color.

export default function manifest(): MetadataRoute.Manifest {
	return {
		background_color: "#ffffff",
		description: "Controlled platform prototype",
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
		name: "Platform Prototype (Internal)",
		short_name: "Platform",
		start_url: "/",
		theme_color: "#000000",
	};
}
