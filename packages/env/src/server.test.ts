import { describe, expect, test } from "bun:test";
import { spawnSync } from "bun";

const validEnv = {
	BETTER_AUTH_SECRET: "unit-test-secret-0123456789abcdef",
	BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:3000,http://localhost:3001",
	BETTER_AUTH_URL: "http://localhost:3000",
	CORS_ORIGIN: "http://localhost:3001",
	DATABASE_URL: "postgresql://postgres:unit-test@localhost:5432/meridian",
};

const loaderScript = [
	'const { env } = await import("./server.ts");',
	"console.log(",
	"JSON.stringify({",
	"corsOrigin: env.CORS_ORIGIN,",
	"trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,",
	"})",
	");",
].join("\n");

function loadServerEnv(overrides: Record<string, string>) {
	const result = spawnSync({
		cmd: [process.execPath, "--eval", loaderScript],
		cwd: import.meta.dir,
		env: {
			...process.env,
			...validEnv,
			NODE_ENV: "test",
			SKIP_ENV_VALIDATION: "",
			...overrides,
		},
		stderr: "pipe",
		stdout: "pipe",
	});
	return {
		exitCode: result.exitCode,
		stderr: result.stderr.toString(),
		stdout: result.stdout.toString(),
	};
}

describe("@meridian/env server schema", () => {
	test("accepts a valid environment and parses trusted origins into a list", () => {
		const result = loadServerEnv({});
		expect(result.exitCode).toBe(0);
		const parsed = JSON.parse(result.stdout) as {
			corsOrigin: string;
			trustedOrigins: string[];
		};
		expect(parsed.corsOrigin).toBe("http://localhost:3001");
		expect(parsed.trustedOrigins).toEqual([
			"http://localhost:3000",
			"http://localhost:3001",
		]);
	});

	test("rejects a BETTER_AUTH_SECRET shorter than 32 characters", () => {
		const result = loadServerEnv({ BETTER_AUTH_SECRET: "too-short" });
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr).toContain("Invalid environment variables");
	});

	test("rejects trusted origins that are not exact URL origins", () => {
		const result = loadServerEnv({
			BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:3000/app",
		});
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr).toContain("exact URL origin");
	});

	test("rejects a CORS_ORIGIN carrying a path, query, or hash", () => {
		const result = loadServerEnv({
			CORS_ORIGIN: "http://localhost:3001/callback?next=1",
		});
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr).toContain("exact URL origin");
	});

	test("treats an empty DATABASE_URL as missing and rejects it", () => {
		const result = loadServerEnv({ DATABASE_URL: "" });
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr).toContain("Invalid environment variables");
	});
});
