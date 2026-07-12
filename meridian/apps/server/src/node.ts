import { serve } from "@hono/node-server";

import app from "./index";
import { parsePort } from "./port";

const port = parsePort(process.env.PORT);

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(
			`Meridian Node fallback listening on http://localhost:${info.port}`
		);
	}
);
