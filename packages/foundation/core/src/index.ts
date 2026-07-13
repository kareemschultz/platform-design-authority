/**
 * `@meridian/foundation-core` — dependency-light Foundation value objects
 * (opaque identifiers, money, result/error taxonomy, time) per
 * `ARCHITECTURE_DEPENDENCY_RULES.md` §Foundation and CLAUDE.md §7.
 */

// biome-ignore-all lint/performance/noBarrelFile: this file is the package's
// intentional public entry point (package.json "exports": "."); it re-exports
// this package's own four small sibling modules, not an unbounded external
// barrel, so the module-graph-bloat concern the rule guards against does not
// apply. Deep imports (e.g. "@meridian/foundation-core/money") remain
// available via the package's other export map entries for callers that want
// to avoid pulling in the whole package.
export * from "./id";
export * from "./money";
export * from "./result";
export * from "./time";
