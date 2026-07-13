/**
 * Compile-time (tsd-style) proof that `Id<TBrand>`, distinct brands of `Id`,
 * and `HumanRef<TBrand>` are all structurally incompatible with each other
 * and with plain `string`, per CLAUDE.md §7's "opaque internal identifiers
 * separately from human references" rule.
 *
 * This file is exercised by `tsc --noEmit` (a stray/missing `@ts-expect-error`
 * fails the type-check) and additionally runs as a normal `bun:test` file so
 * `bun test` surfaces it too — the assertions below are trivial runtime
 * no-ops; the real assertions are the `@ts-expect-error` comments themselves.
 */

import { describe, expect, test } from "bun:test";
import type { HumanRef, Id } from "./id";
import { newId, toHumanRef } from "./id";

describe("Id / HumanRef brand separation (compile-time)", () => {
	test("a plain string is not assignable to a branded Id", () => {
		// @ts-expect-error -- a bare string literal is not an Id<"User">; it
		// must be produced by newId/parseId, which perform the branding.
		const bad: Id<"User"> = "not-branded";
		expect(typeof bad).toBe("string");
	});

	test("an Id<A> is not assignable to Id<B> for a different brand A", () => {
		const userId = newId<"User">();
		// @ts-expect-error -- Id<"User"> and Id<"Order"> are nominally distinct
		// even though both are strings at runtime.
		const orderId: Id<"Order"> = userId;
		expect(String(orderId)).toBe(String(userId));
	});

	test("an Id is not assignable to a HumanRef of the same brand name", () => {
		const userId = newId<"User">();
		// @ts-expect-error -- Id and HumanRef are separate brand families;
		// CLAUDE.md §7 requires opaque ids and human references never mix.
		const humanRef: HumanRef<"User"> = userId;
		expect(String(humanRef)).toBe(String(userId));
	});

	test("a HumanRef is not assignable to an Id of the same brand name", () => {
		const ref = toHumanRef<"Invoice">("INV-0001");
		// @ts-expect-error -- see above; the incompatibility holds symmetrically.
		const id: Id<"Invoice"> = ref;
		expect(String(id)).toBe(String(ref));
	});

	test("a plain string is not assignable to a branded HumanRef", () => {
		// @ts-expect-error -- HumanRef values must be constructed via
		// toHumanRef, not assigned from a bare string literal.
		const bad: HumanRef<"Invoice"> = "INV-0001";
		expect(typeof bad).toBe("string");
	});

	test("newId<TBrand>() is still assignable to its own brand", () => {
		const id: Id<"User"> = newId<"User">();
		expect(typeof id).toBe("string");
	});
});
