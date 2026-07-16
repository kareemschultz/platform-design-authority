import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	deps: {
		alwaysBundle: [/@meridian\/.*/],
	},
	dts: false,
	entry: ["./composition/main.ts"],
	format: "esm",
	outDir: "./dist",
});
