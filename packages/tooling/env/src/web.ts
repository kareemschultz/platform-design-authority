import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_SERVER_URL: z.url(),
	},
	emptyStringAsUndefined: true,
	runtimeEnv: {
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
		PLATFORM_API_INTERNAL_URL: process.env.PLATFORM_API_INTERNAL_URL,
	},
	server: {
		PLATFORM_API_INTERNAL_URL: z.url().optional(),
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
