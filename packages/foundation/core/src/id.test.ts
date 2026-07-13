import { describe, expect, test } from "bun:test";
import { isId, newId, parseId, toHumanRef } from "./id";

type UserId = ReturnType<typeof newId<"User">>;

const UUID_SHAPE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("newId", () => {
	test("produces a well-formed UUID string", () => {
		const id = newId<"User">();
		expect(id).toMatch(UUID_SHAPE);
	});

	test("sets the UUIDv7 version nibble", () => {
		const id = newId<"User">();
		const versionNibble = id.split("-")[2]?.[0];
		expect(versionNibble).toBe("7");
	});

	test("sets the RFC 4122 variant bits (10xx) on the first nibble of the 4th group", () => {
		const id = newId<"User">();
		const variantNibble = id.split("-")[3]?.[0];
		expect(variantNibble).toBeDefined();
		const variantValue = Number.parseInt(variantNibble as string, 16);
		// Top two bits must be "10": values 8..b.
		expect(variantValue).toBeGreaterThanOrEqual(0x8);
		expect(variantValue).toBeLessThanOrEqual(0xb);
	});

	test("is unique across 10,000 generations", () => {
		const seen = new Set<string>();
		for (let i = 0; i < 10_000; i += 1) {
			seen.add(newId<"User">());
		}
		expect(seen.size).toBe(10_000);
	});

	test("is monotonically non-decreasing across rapid generations (UUIDv7 sorts chronologically)", () => {
		const ids: UserId[] = [];
		for (let i = 0; i < 5000; i += 1) {
			ids.push(newId<"User">());
		}
		const sorted = [...ids].sort();
		expect(ids).toEqual(sorted);
	});

	test("embeds a timestamp within a tight window of Date.now()", () => {
		const before = Date.now();
		const id = newId<"User">();
		const after = Date.now();

		const hex = id.replace(/-/g, "");
		const timestampHex = hex.slice(0, 12);
		const timestampMs = Number.parseInt(timestampHex, 16);

		expect(timestampMs).toBeGreaterThanOrEqual(before - 1);
		expect(timestampMs).toBeLessThanOrEqual(after + 1);
	});
});

describe("isId", () => {
	test("accepts a generated id", () => {
		expect(isId(newId<"User">())).toBe(true);
	});

	test("accepts any RFC-4122-shaped UUID regardless of version", () => {
		expect(isId("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
	});

	test("rejects non-UUID strings", () => {
		expect(isId("not-a-uuid")).toBe(false);
		expect(isId("")).toBe(false);
		expect(isId("123e4567e89b12d3a456426614174000")).toBe(false);
	});

	test("is case-insensitive", () => {
		expect(isId("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
	});
});

describe("parseId", () => {
	test("returns the branded id for a well-formed UUID", () => {
		const raw = newId<"User">();
		const parsed = parseId<"User">(raw);
		expect(parsed).toBe(raw);
	});

	test("returns undefined for a malformed string", () => {
		expect(parseId<"User">("nope")).toBeUndefined();
	});
});

describe("toHumanRef", () => {
	test("brands a non-empty string", () => {
		const ref = toHumanRef<"Invoice">("INV-2026-0001");
		expect(String(ref)).toBe("INV-2026-0001");
	});

	test("throws on an empty string", () => {
		expect(() => toHumanRef<"Invoice">("")).toThrow();
	});
});
