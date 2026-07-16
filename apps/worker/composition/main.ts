import { runDeliveryCycle } from "./delivery";
import { closeWorkerDatabase } from "./postgres";

let stopping = false;

function requestShutdown(): void {
	stopping = true;
}

process.once("SIGINT", requestShutdown);
process.once("SIGTERM", requestShutdown);

while (!stopping) {
	let processed = false;
	try {
		// biome-ignore lint/performance/noAwaitInLoops: a worker claims one bounded event at a time so shutdown and stream ordering remain deterministic.
		processed = await runDeliveryCycle();
	} catch {
		// Safe degraded behavior: no payload, SQL, exception, or tenant data is
		// emitted. The next bounded cycle retries after PostgreSQL recovers.
	}
	if (!(processed || stopping)) {
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
}

await closeWorkerDatabase();
