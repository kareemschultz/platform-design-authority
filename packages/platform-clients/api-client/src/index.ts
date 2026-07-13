/**
 * Typed oRPC client surface for `apps/server`'s router.
 *
 * TEMPORARY ARCHITECTURE EXCEPTION (see `registry/architecture-rules.json`
 * `exceptions[]`, id `platform-clients-api-client-server-type-import`,
 * expires when WS1 lands a contract-first oRPC setup): `platform-clients`
 * packages may only depend on `foundation`/`contracts` per the governed
 * dependency rules, but no decoupled contract (an `@orpc/contract`-style
 * input/output definition independent of the server's own procedure
 * implementation) exists yet — the router's client type can currently only
 * be derived from the concrete `appRouter` object in `apps/server`. This is
 * a type-only import (erased at build time, zero runtime coupling), but it
 * is still a real source-level dependency edge outside the declared family
 * graph, so it is recorded rather than silently introduced.
 */
export type { AppRouterClient } from "../../../../apps/server/src/router";
