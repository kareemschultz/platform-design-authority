/**
 * Public surface of `@meridian/platform-identity`.
 *
 * Better Auth and concrete persistence are internal details behind this
 * anti-corruption layer per
 * `FIRST_SLICE_IMPLEMENTATION_PLAN.md`'s WS1 definition: domains and other
 * packages consume the factory and published ports, never the underlying
 * database handle or Better Auth's own table shapes directly.
 */
// biome-ignore lint/performance/noBarrelFile: this is the package's deliberate anti-corruption-layer entry point, not an accidental re-export barrel.
export {
	bindIdentityPersistence,
	type CreateIdentityAuthOptions,
	createIdentityAuth,
	type IdentityAuth,
	type IdentityPersistence,
	requirePasskeyUserVerification,
} from "./auth";
export type {
	IdentityAccountSummary,
	IdentityDirectoryPort,
	IdentityOrganizationProjection,
} from "./directory";
export { isBlockedNativeAuthHttpRoute } from "./security";
export {
	createIdentitySessionApplication,
	type IdentitySessionCommandReceipt,
	IdentitySessionError,
	type IdentitySessionRecord,
	type IdentitySessionRepository,
	type IdentitySessionTransactionScope,
	type IdentitySessionUnitOfWork,
} from "./session";
