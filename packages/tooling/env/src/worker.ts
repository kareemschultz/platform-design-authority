import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const workerEnv = createEnv({
	emptyStringAsUndefined: true,
	runtimeEnv: process.env,
	server: {
		DATABASE_URL: z
			.string()
			.min(1)
			.refine(
				(value) =>
					value.startsWith("postgres://") || value.startsWith("postgresql://"),
				{ message: "DATABASE_URL must be a PostgreSQL connection string" }
			),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		WORKER_DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(5).default(5),
		WORKER_PAUSED_TENANT_IDS: z
			.string()
			.regex(/^[A-Za-z0-9_-]+(?:,[A-Za-z0-9_-]+)*$/)
			.optional(),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
