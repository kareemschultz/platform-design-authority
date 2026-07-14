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

const exactOrigin = z
	.string()
	.min(1)
	.transform((value, ctx) => {
		try {
			const parsed = new URL(value);
			if (
				parsed.origin !== value ||
				parsed.pathname !== "/" ||
				parsed.search ||
				parsed.hash
			) {
				ctx.addIssue({
					code: "custom",
					message: `CORS origin must be an exact URL origin: ${value}`,
				});
			}
		} catch {
			ctx.addIssue({
				code: "custom",
				message: `CORS origin must be a valid URL origin: ${value}`,
			});
		}

		return value;
	});

export const env = createEnv({
	emptyStringAsUndefined: true,
	runtimeEnv: process.env,
	server: {
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_TRUSTED_ORIGINS: exactOrigins,
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: exactOrigin,
		DATABASE_URL: z
			.string()
			.min(1)
			.refine(
				(value) =>
					value.startsWith("postgres://") || value.startsWith("postgresql://"),
				{ message: "DATABASE_URL must be a PostgreSQL connection string" }
			),
		IDENTITY_DISPLAY_NAME: z.string().min(1).max(100),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		PORT: z.coerce.number().int().min(1).max(65_535).optional(),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
