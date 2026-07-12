import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	entry: ["./src/index.ts", "./src/node.ts"],
	format: "esm",
	noExternal: [/@meridian\/.*/],
	outDir: "./dist",
});
