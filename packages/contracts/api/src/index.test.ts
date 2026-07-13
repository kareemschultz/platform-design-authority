import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ENDPOINTS, KNOWN_PERMISSION_IDS } from "./index";

interface ManifestEndpoint {
	authorization?: string;
	method: string;
	path: string;
	permission?: string;
}

/**
 * `packages/contracts/api` may depend only on `packages/foundation` per
 * `registry/architecture-rules.json`, so this test reads the governed
 * registries directly from disk (like `scripts/generate_contracts.py` does)
 * rather than importing a sibling contracts package.
 */
const REPO_ROOT = join(import.meta.dir, "..", "..", "..", "..");

function loadEndpointManifest(): ManifestEndpoint[] {
	const raw = readFileSync(
		join(REPO_ROOT, "registry", "endpoint-permissions.json"),
		"utf8"
	);
	return (JSON.parse(raw) as { endpoints: ManifestEndpoint[] }).endpoints;
}

describe("@meridian/contracts-api ENDPOINTS", () => {
	test("has exactly one row per registry/endpoint-permissions.json entry", () => {
		const manifest = loadEndpointManifest();
		expect(ENDPOINTS.length as number).toBe(manifest.length);
	});

	test("every declared permission is a known permission id", () => {
		for (const endpoint of ENDPOINTS) {
			if ("permission" in endpoint) {
				expect(KNOWN_PERMISSION_IDS).toContain(endpoint.permission);
			}
		}
	});

	test("every endpoint declares exactly one authority marker", () => {
		for (const endpoint of ENDPOINTS) {
			const hasPermission = "permission" in endpoint;
			const hasAuthorization = "authorization" in endpoint;
			expect(hasPermission).not.toBe(hasAuthorization);
		}
	});
});
