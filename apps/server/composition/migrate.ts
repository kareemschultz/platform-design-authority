import { runMigrationStreams } from "./migrations";
import { closeDatabaseComposition, databasePool } from "./postgres";

try {
	await runMigrationStreams(databasePool);
} finally {
	await closeDatabaseComposition();
}
