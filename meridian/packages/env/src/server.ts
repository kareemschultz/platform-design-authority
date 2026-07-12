import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const exactOrigins = z
	.string()
	.min(1)
	.transform((value, ctx) => {
		const origins = value
			.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean);

		for (const origin of origins) {
			try {
				const parsed = new URL(origin);
				if (
					parsed.origin !== origin ||
					parsed.pathname !== "/" ||
					parsed.search ||
					parsed.hash
				) {
					ctx.addIssue({
						code: "custom",
						message: `Trusted origin must be an exact URL origin: ${origin}`,
					});
				}
			} catch {
				ctx.addIssue({
					code: "custom",
					message: `Trusted origin must be a valid URL origin: ${origin}`,
				});
			}
		}

		return origins;
	});

export const env = createEnv({
	emptyStringAsUndefined: true,
	runtimeEnv: process.env,
	server: {
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_TRUSTED_ORIGINS: exactOrigins,
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		DATABASE_URL: z.string().min(1),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
