import { expect, test } from "bun:test";
import { spawnSync } from "bun";

const corsProbeScript = `
const { default: app } = await import("./index.ts");
const response = await app.request("/v1/stock-counts/count_example_01/draft-lines", {
  headers: {
    "Access-Control-Request-Headers": "content-type,idempotency-key,x-active-context-id",
    "Access-Control-Request-Method": "PUT",
    Origin: process.env.CORS_ORIGIN,
  },
  method: "OPTIONS",
});
console.log(JSON.stringify({
  allowedHeaders: response.headers.get("Access-Control-Allow-Headers"),
  allowedMethods: response.headers.get("Access-Control-Allow-Methods"),
  status: response.status,
}));
`;

test("CORS preflight allows governed context and idempotency headers", () => {
	const result = spawnSync({
		cmd: [process.execPath, "--eval", corsProbeScript],
		cwd: import.meta.dir,
		env: {
			...process.env,
			BETTER_AUTH_SECRET: "unit-test-secret-0123456789abcdef",
			BETTER_AUTH_TRUSTED_ORIGINS:
				"http://localhost:3000,http://localhost:3001",
			BETTER_AUTH_URL: "http://localhost:3000",
			CORS_ORIGIN: "http://localhost:3001",
			DATABASE_URL: "postgresql://postgres:unit-test@localhost:5432/meridian",
			IDENTITY_DISPLAY_NAME: "Business Operating Platform",
			NODE_ENV: "test",
		},
		stderr: "pipe",
		stdout: "pipe",
	});

	expect(result.exitCode, result.stderr.toString()).toBe(0);
	const output = JSON.parse(result.stdout.toString()) as {
		allowedHeaders: string;
		allowedMethods: string;
		status: number;
	};
	expect(output.status).toBe(204);
	const allowedHeaders = output.allowedHeaders.toLowerCase();
	expect(allowedHeaders).toContain("idempotency-key");
	expect(allowedHeaders).toContain("x-active-context-id");
	expect(output.allowedMethods.toUpperCase()).toContain("PUT");
}, 10_000);
