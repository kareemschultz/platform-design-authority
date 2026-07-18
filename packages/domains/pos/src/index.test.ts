import { describe, expect, test } from "bun:test";
import {
	APPROVAL_STATES,
	type CashMovementRecord,
	createPosApplication,
	createPosService,
	type PendingPosEvent,
	type PosCommandReceipt,
	PosError,
	type PosIdFactory,
	type PosPermission,
	type PosRepository,
	REGISTER_SESSION_STATES,
	type RegisterSessionRecord,
	SALE_STATES,
} from ".";

describe("POS contract scaffold", () => {
	test("register sessions have no reopen transition", () => {
		expect(REGISTER_SESSION_STATES).toEqual(["Open", "Closing", "Closed"]);
		expect(REGISTER_SESSION_STATES).not.toContain("Reopened");
	});

	test("a variance close occupies a distinct pending state from a completed close", () => {
		expect(REGISTER_SESSION_STATES).toContain("Closing");
		expect(REGISTER_SESSION_STATES.indexOf("Closing")).toBeLessThan(
			REGISTER_SESSION_STATES.indexOf("Closed")
		);
	});

	test("a held sale is distinct from a completed sale", () => {
		expect(SALE_STATES).toContain("Held");
		expect(SALE_STATES).toContain("Completed");
		expect(SALE_STATES.indexOf("Held")).toBeLessThan(
			SALE_STATES.indexOf("Completed")
		);
	});

	test("maker/checker approval never starts pre-approved", () => {
		expect(APPROVAL_STATES[0]).toBe("Pending");
		expect(APPROVAL_STATES).toContain("Approved");
	});
});

function createInMemoryRepository() {
	const sessions = new Map<string, RegisterSessionRecord>();
	const movements: CashMovementRecord[] = [];
	const receipts = new Map<string, PosCommandReceipt>();

	const repository: PosRepository = {
		acquireCommandLock: () => Promise.resolve(),
		createCashMovement: (record) => {
			movements.push(record);
			return Promise.resolve(record);
		},
		getCommandReceipt: (tenantId, operation, idempotencyKey) =>
			Promise.resolve(
				receipts.get(`${tenantId}${operation}${idempotencyKey}`) ?? null
			),
		getOpenSession: (tenantId, registerId) =>
			Promise.resolve(
				[...sessions.values()].find(
					(session) =>
						session.tenantId === tenantId &&
						session.registerId === registerId &&
						session.state === "Open"
				) ?? null
			),
		getSession: (tenantId, sessionId) => {
			const record = sessions.get(sessionId);
			return Promise.resolve(
				record && record.tenantId === tenantId ? record : null
			);
		},
		netCashMovements: (tenantId, sessionId) => {
			const relevant = movements.filter(
				(movement) =>
					movement.tenantId === tenantId && movement.sessionId === sessionId
			);
			return Promise.resolve({
				paidInMinor: relevant
					.filter((movement) => movement.direction === "PaidIn")
					.reduce((sum, movement) => sum + movement.amountMinor, 0),
				paidOutMinor: relevant
					.filter((movement) => movement.direction === "PaidOut")
					.reduce((sum, movement) => sum + movement.amountMinor, 0),
			});
		},
		openRegister: (record) => {
			// Mirrors the Postgres partial unique index
			// (pos_register_session_open_register_uidx) predicate: a `Closing`
			// session still holds an unreconciled custody position pending
			// commerce.cash-variance.approve, so it blocks a new open exactly
			// like an `Open` session does — not just `Open` itself.
			const existingLive = [...sessions.values()].find(
				(session) =>
					session.tenantId === record.tenantId &&
					session.registerId === record.registerId &&
					(session.state === "Open" || session.state === "Closing")
			);
			if (existingLive) {
				return Promise.resolve("already_open" as const);
			}
			sessions.set(record.id, record);
			return Promise.resolve(record);
		},
		recordCommandReceipt: (receipt) => {
			const key = `${receipt.tenantId}${receipt.operation}${receipt.idempotencyKey}`;
			const existing = receipts.get(key);
			if (existing) {
				return Promise.resolve({ inserted: false, record: existing });
			}
			receipts.set(key, receipt);
			return Promise.resolve({ inserted: true, record: receipt });
		},
		updateSession: (record, expectedVersion) => {
			const current = sessions.get(record.id);
			if (!current || current.version !== expectedVersion) {
				return Promise.resolve("version_conflict" as const);
			}
			sessions.set(record.id, record);
			return Promise.resolve(record);
		},
	};

	return { movements, receipts, repository, sessions };
}

function createHarness() {
	const { movements, repository, sessions } = createInMemoryRepository();
	const events: PendingPosEvent[] = [];
	let sequence = 0;
	const ids: PosIdFactory = {
		create(kind) {
			sequence += 1;
			return `${kind}_${sequence.toString().padStart(6, "0")}`;
		},
	};
	const seenEventIds = new Set<string>();
	const service = createPosService({
		clock: () => new Date("2026-07-18T12:00:00.000Z"),
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: {
						append: (envelope) => {
							if (seenEventIds.has(envelope.id)) {
								return Promise.resolve("duplicate" as const);
							}
							seenEventIds.add(envelope.id);
							events.push(envelope);
							return Promise.resolve("inserted" as const);
						},
					},
					repository,
				}),
		},
	});
	return { events, ids, movements, service, sessions };
}

const base = {
	actorUserId: "user_maker",
	correlationId: "correlation_pos_unit",
	locationId: "location_a",
	organizationId: "organization_a",
	registerId: "register_a",
	tenantId: "tenant_a",
};

describe("POS domain: RegisterSession lifecycle", () => {
	test("opens a register and rejects a concurrent second open on the same register", async () => {
		const { service } = createHarness();
		const opened = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "open-1",
			openingFloat: { amountMinor: 50_000, currency: "GYD" },
		});
		expect(opened.state).toBe("Open");
		expect(opened.registerId).toBe(base.registerId);

		const secondOpen = service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "open-2",
			openingFloat: { amountMinor: 10_000, currency: "GYD" },
		});
		await expect(secondOpen).rejects.toMatchObject({ code: "invalid_state" });
		await expect(secondOpen).rejects.toBeInstanceOf(PosError);
	});

	test("rejects opening a register while a prior session on it is Closing, pending variance approval", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closing-race-open-1",
			openingFloat: { amountMinor: 10_000, currency: "GYD" },
		});
		const closing = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 9500, currency: "GYD" },
			idempotencyKey: "closing-race-close-1",
		});
		expect(closing.state).toBe("Closing");

		const openWhileClosing = service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closing-race-open-2",
			openingFloat: { amountMinor: 5000, currency: "GYD" },
		});
		await expect(openWhileClosing).rejects.toMatchObject({
			code: "invalid_state",
		});
		await expect(openWhileClosing).rejects.toBeInstanceOf(PosError);
	});

	test("opens a new session after a prior session on the same register closed", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reopen-open-1",
			openingFloat: { amountMinor: 0, currency: "GYD" },
		});
		await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "reopen-close-1",
		});
		const second = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reopen-open-2",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
		});
		expect(second.state).toBe("Open");
	});

	test("rejects a cash movement once the register has no open session", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closed-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
		});
		await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "closed-close",
		});
		const movement = service.createCashMovement({
			...base,
			amount: { amountMinor: 500, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "closed-movement",
			reasonCode: "PaidIn",
		});
		await expect(movement).rejects.toMatchObject({ code: "invalid_state" });
	});

	test("computes zero, short, and over cash variance and gates approval only on non-zero", async () => {
		const { service } = createHarness();

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-zero-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_zero",
		});
		const zero = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 1000, currency: "GYD" },
			idempotencyKey: "variance-zero-close",
			registerId: "register_zero",
		});
		expect(zero.state).toBe("Closed");
		expect(zero.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(zero.varianceApprovalRequired).toBe(false);

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-short-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_short",
		});
		const short = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 800, currency: "GYD" },
			idempotencyKey: "variance-short-close",
			registerId: "register_short",
		});
		expect(short.state).toBe("Closing");
		expect(short.variance).toEqual({ amountMinor: -200, currency: "GYD" });
		expect(short.varianceApprovalRequired).toBe(true);

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-over-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_over",
		});
		const over = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 1300, currency: "GYD" },
			idempotencyKey: "variance-over-close",
			registerId: "register_over",
		});
		expect(over.state).toBe("Closing");
		expect(over.variance).toEqual({ amountMinor: 300, currency: "GYD" });
		expect(over.varianceApprovalRequired).toBe(true);
	});

	test("factors posted cash movements into expected cash before computing variance", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "movement-open",
			openingFloat: { amountMinor: 5000, currency: "GYD" },
			registerId: "register_movements",
		});
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 2000, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "movement-paid-in",
			reasonCode: "PaidIn",
			registerId: "register_movements",
		});
		await service.createCashMovement({
			...base,
			amount: { amountMinor: 1500, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: "movement-safe-drop",
			reasonCode: "SafeDrop",
			registerId: "register_movements",
		});
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 5500, currency: "GYD" },
			idempotencyKey: "movement-close",
			registerId: "register_movements",
		});
		expect(closed.expectedCash).toEqual({
			amountMinor: 5500,
			currency: "GYD",
		});
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
		expect(closed.state).toBe("Closed");
	});

	test("keeps posted cash movements append-only: a correction is a new opposite movement, never an edit", async () => {
		const { movements, service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "reversal-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: "register_reversal",
		});
		const posted = await service.createCashMovement({
			...base,
			amount: { amountMinor: 500, currency: "GYD" },
			direction: "PaidOut",
			idempotencyKey: "reversal-original",
			reasonCode: "Other",
			registerId: "register_reversal",
		});
		const correction = await service.createCashMovement({
			...base,
			amount: { amountMinor: 500, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "reversal-correction",
			note: "correction of erroneous paid-out",
			reasonCode: "Other",
			registerId: "register_reversal",
		});
		expect(posted.id).not.toBe(correction.id);
		expect(movements).toHaveLength(2);
		expect(
			movements.every((movement) => movement.registerId === "register_reversal")
		).toBe(true);
		const closed = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 0, currency: "GYD" },
			idempotencyKey: "reversal-close",
			registerId: "register_reversal",
		});
		expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
	});

	test("denies self-approval of a cash variance and allows a different approver to close it", async () => {
		const { events, service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "self-open",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: "register_self_approval",
		});
		const closing = await service.closeRegister({
			...base,
			countedCash: { amountMinor: 900, currency: "GYD" },
			idempotencyKey: "self-close",
			registerId: "register_self_approval",
		});
		expect(closing.state).toBe("Closing");

		const selfApproval = service.approveCashVariance({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			idempotencyKey: "self-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		await expect(selfApproval).rejects.toMatchObject({
			code: "approval_separation",
		});
		expect(
			events.some((envelope) => envelope.name === "commerce.register.closed.v1")
		).toBe(false);

		const approved = await service.approveCashVariance({
			actorUserId: "user_checker",
			correlationId: base.correlationId,
			idempotencyKey: "checker-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		expect(approved.state).toBe("Closed");
		expect(approved.varianceApproverPartyId).toBe("party_user_checker");
		const closedEvents = events.filter(
			(envelope) => envelope.name === "commerce.register.closed.v1"
		);
		expect(closedEvents).toHaveLength(1);
		expect(closedEvents[0]?.data).toMatchObject({
			varianceApprovalRequired: true,
			varianceApproverPartyId: "party_user_checker",
			varianceMinor: -100,
		});
	});

	test("replays an idempotent open and cash-movement command without duplicating effects", async () => {
		const { events, movements, service, sessions } = createHarness();
		const first = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "replay-open",
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId: "register_replay",
		});
		const replayed = await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "replay-open",
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId: "register_replay",
		});
		expect(replayed).toEqual(first);
		expect(sessions.size).toBe(1);
		expect(
			events.filter(
				(envelope) => envelope.name === "commerce.register.opened.v1"
			)
		).toHaveLength(1);

		const firstMovement = await service.createCashMovement({
			...base,
			amount: { amountMinor: 250, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "replay-movement",
			reasonCode: "PaidIn",
			registerId: "register_replay",
		});
		const replayedMovement = await service.createCashMovement({
			...base,
			amount: { amountMinor: 250, currency: "GYD" },
			direction: "PaidIn",
			idempotencyKey: "replay-movement",
			reasonCode: "PaidIn",
			registerId: "register_replay",
		});
		expect(replayedMovement).toEqual(firstMovement);
		expect(movements).toHaveLength(1);
	});

	test("rejects a different request body reusing an already-claimed idempotency key", async () => {
		const { service } = createHarness();
		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "conflict-open",
			openingFloat: { amountMinor: 100, currency: "GYD" },
			registerId: "register_conflict",
		});
		const conflicting = service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "conflict-open",
			openingFloat: { amountMinor: 999, currency: "GYD" },
			registerId: "register_conflict_other",
		});
		await expect(conflicting).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
	});

	test("validates money and direction/reason-code pairing at the domain boundary", async () => {
		const { service } = createHarness();
		await expect(
			service.openRegister({
				...base,
				currency: "GY",
				idempotencyKey: "validation-bad-currency",
				openingFloat: { amountMinor: 100, currency: "GY" },
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await expect(
			service.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "validation-negative-float",
				openingFloat: { amountMinor: -1, currency: "GYD" },
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await service.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "validation-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: "register_validation",
		});

		await expect(
			service.createCashMovement({
				...base,
				amount: { amountMinor: 0, currency: "GYD" },
				direction: "PaidIn",
				idempotencyKey: "validation-zero-amount",
				reasonCode: "PaidIn",
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await expect(
			service.createCashMovement({
				...base,
				amount: { amountMinor: 100, currency: "USD" },
				direction: "PaidIn",
				idempotencyKey: "validation-currency-mismatch",
				reasonCode: "PaidIn",
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });

		await expect(
			service.createCashMovement({
				...base,
				amount: { amountMinor: 100, currency: "GYD" },
				direction: "PaidIn",
				idempotencyKey: "validation-safe-drop-direction",
				reasonCode: "SafeDrop",
				registerId: "register_validation",
			})
		).rejects.toMatchObject({ code: "validation" });
	});
});

describe("POS application: permission-before-dispatch and self-approval separation", () => {
	function createApplicationHarness(input: { permissionGranted?: boolean }) {
		const { service } = createHarness();
		let dispatched = false;
		const wrapped = {
			...service,
			openRegister: (args: Parameters<typeof service.openRegister>[0]) => {
				dispatched = true;
				return service.openRegister(args);
			},
		};
		const permissionCalls: PosPermission[] = [];
		const application = createPosApplication({
			activeContexts: {
				requireActiveContext: () =>
					Promise.resolve({
						organizationId: base.organizationId,
						tenantId: base.tenantId,
					}),
			},
			entitlements: {
				requireEntitlement: () => Promise.resolve(),
			},
			permissions: {
				requirePermission: (permissionInput) => {
					permissionCalls.push(permissionInput.permission);
					if (input.permissionGranted === false) {
						return Promise.reject(
							Object.assign(new Error("permission denied"), {
								code: "authorization_denied",
							})
						);
					}
					return Promise.resolve();
				},
			},
			service: wrapped,
		});
		return {
			application,
			isDispatched: () => dispatched,
			permissionCalls,
		};
	}

	test("checks permission before dispatching to the service", async () => {
		const { application, isDispatched, permissionCalls } =
			createApplicationHarness({ permissionGranted: false });
		const attempt = application.openRegister({
			actorUserId: base.actorUserId,
			contextId: "context_a",
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "app-denied-open",
			locationId: base.locationId,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: base.registerId,
			sessionId: "session_a",
		});
		await expect(attempt).rejects.toMatchObject({
			code: "authorization_denied",
		});
		expect(permissionCalls).toEqual(["commerce.register.open"]);
		expect(isDispatched()).toBe(false);
	});

	test("dispatches to the service once permission and entitlement are granted", async () => {
		const { application, isDispatched } = createApplicationHarness({
			permissionGranted: true,
		});
		const opened = await application.openRegister({
			actorUserId: base.actorUserId,
			contextId: "context_a",
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "app-allowed-open",
			locationId: base.locationId,
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId: base.registerId,
			sessionId: "session_a",
		});
		expect(opened.state).toBe("Open");
		expect(isDispatched()).toBe(true);
	});
});
