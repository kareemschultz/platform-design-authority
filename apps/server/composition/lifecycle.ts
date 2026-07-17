/**
 * Shutdown-only composition surface. Ordinary application paths import this
 * module, never `./postgres`, so the raw process pool stays composition-internal
 * (fifth-audit F-B-005; enforced by `pool-import-outside-composition`).
 */
import { closeDatabaseComposition as closePool } from "./postgres";

export function closeDatabaseComposition(): Promise<void> {
	return closePool();
}
