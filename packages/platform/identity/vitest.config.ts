import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/test-utils.test.ts", "src/session.test.ts"],
	},
});
