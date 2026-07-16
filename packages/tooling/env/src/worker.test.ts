import { describe, expect, test } from "bun:test";
import { spawnSync } from "bun";

const loaderScript = [
	'const { workerEnv } = await import("./worker.ts");',
	"console.log(JSON.stringify({ max: workerEnv.WORKER_DATABASE_POOL_MAX }));",
].join("\n");

function loadWorkerEnv(maximum: string) {
	return spawnSync({
		cmd: [process.execPath, "--eval", loaderScript],
		cwd: import.meta.dir,
		env: {
			...process.env,
			DATABASE_URL: "postgresql://postgres:test@localhost:5432/meridian",
			NODE_ENV: "test",
			SKIP_ENV_VALIDATION: "",
			WORKER_DATABASE_POOL_MAX: maximum,
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
});
