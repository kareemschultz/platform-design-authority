import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	deps: {
		alwaysBundle: [/@meridian\/.*/],
	},
	dts: false,
	entry: ["./src/index.ts", "./src/node.ts"],
	format: "esm",
	outDir: "./dist",
});
