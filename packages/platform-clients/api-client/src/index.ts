import type { appApiContract } from "@meridian/contracts-platform-api";
import type { ContractRouterClient } from "@orpc/contract";

/**
 * Client shape derived from the transport-neutral contract package.
 *
 * The canonical OpenAPI remains authoritative; the contract package carries a
 * generated semantic-parity manifest and contains no server implementation.
 */
export type PlatformApiClient = ContractRouterClient<typeof appApiContract>;

/** Compatibility alias for consumers of the WS0 scaffold name. */
export type AppRouterClient = PlatformApiClient;
