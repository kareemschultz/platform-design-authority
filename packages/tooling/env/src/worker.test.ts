import { describe, expect, test } from "bun:test";
import { spawnSync } from "bun";

const loaderScript = [
	'const { workerEnv } = await import("./worker.ts");',
	"console.log(JSON.stringify({ max: workerEnv.WORKER_DATABASE_POOL_MAX, paused: workerEnv.WORKER_PAUSED_TENANT_IDS }));",
].join("\n");

function loadWorkerEnv(maximum: string, paused?: string) {
	return spawnSync({
		cmd: [process.execPath, "--eval", loaderScript],
		cwd: import.meta.dir,
		env: {
			...process.env,
			DATABASE_URL: "postgresql://postgres:test@localhost:5432/meridian",
			NODE_ENV: "test",
			SKIP_ENV_VALIDATION: "",
			WORKER_DATABASE_POOL_MAX: maximum,
			...(paused ? { WORKER_PAUSED_TENANT_IDS: paused } : {}),
		},
		stderr: "pipe",
		stdout: "pipe",
	});
}

describe("@meridian/tooling-env worker schema", () => {
	test("binds the reviewed worker pool maximum", () => {
		const accepted = loadWorkerEnv("5");
		expect(accepted.exitCode).toBe(0);
		expect(JSON.parse(accepted.stdout.toString())).toEqual({ max: 5 });
		const rejected = loadWorkerEnv("6");
		expect(rejected.exitCode).not.toBe(0);
	});

	test("accepts only bounded opaque tenant identifiers for pause control", () => {
		const accepted = loadWorkerEnv("5", "tenant_a,tenant-b");
		expect(accepted.exitCode).toBe(0);
		expect(JSON.parse(accepted.stdout.toString())).toEqual({
			max: 5,
			paused: "tenant_a,tenant-b",
		});
		expect(loadWorkerEnv("5", "tenant_a, tenant_b").exitCode).not.toBe(0);
	});
});
