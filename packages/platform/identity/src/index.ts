/**
 * Public surface of `@meridian/platform-identity`.
 *
 * Better Auth, the shared Drizzle connection, and the auth schema are
 * internal details behind this anti-corruption layer per
 * `FIRST_SLICE_IMPLEMENTATION_PLAN.md`'s WS1 definition: domains and other
 * packages consume `auth` and `closeDb`, never the underlying database
 * handle or Better Auth's own table shapes directly.
 */
// biome-ignore lint/performance/noBarrelFile: this is the package's deliberate anti-corruption-layer entry point, not an accidental re-export barrel.
export { auth } from "./auth";
export { closeDb } from "./db";
export { isBlockedNativeAuthHttpRoute } from "./security";
