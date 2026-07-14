import type { EventEnvelope } from "@meridian/contracts-events";
import type { SessionSummary } from "@meridian/contracts-platform-api";

export interface IdentitySessionRecord {
	createdAt: Date;
	expiresAt: Date;
	id: string;
	ipAddress?: string | null;
	updatedAt: Date;
	userAgent?: string | null;
	userId: string;
}

export interface IdentitySessionCommandReceipt {
	authUserId: string;
	completedAt?: Date;
	idempotencyKey: string;
	operation: "session.revoke";
	requestFingerprint: string;
	sessionId: string;
}

export interface IdentitySessionRepository {
	claimCommandReceipt: (
		receipt: IdentitySessionCommandReceipt
	) => Promise<{ inserted: boolean; receipt: IdentitySessionCommandReceipt }>;
	completeCommandReceipt: (
		receipt: IdentitySessionCommandReceipt & { completedAt: Date }
	) => Promise<void>;
	findCommandReceipt: (input: {
		authUserId: string;
		idempotencyKey: string;
		operation: "session.revoke";
	}) => Promise<IdentitySessionCommandReceipt | null>;
	findOwned: (
		authUserId: string,
		sessionId: string
	) => Promise<IdentitySessionRecord | null>;
	listOwned: (authUserId: string) => Promise<IdentitySessionRecord[]>;
	revokeOwned: (authUserId: string, sessionId: string) => Promise<boolean>;
}

type PendingEvent = Omit<EventEnvelope<Record<string, unknown>>, "publishedAt">;

export interface IdentitySessionTransactionScope {
	events: {
		append: (event: PendingEvent) => Promise<"inserted" | "duplicate">;
	};
	repository: IdentitySessionRepository;
}

export interface IdentitySessionUnitOfWork {
	execute: <TResult>(
		operation: (scope: IdentitySessionTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

export class IdentitySessionError extends Error {
	readonly code: "idempotency_conflict";

	constructor(code: "idempotency_conflict", message: string) {
		super(message);
		this.code = code;
		this.name = "IdentitySessionError";
	}
}

const EDGE_USER_AGENT = /Edg\//u;
const FIREFOX_USER_AGENT = /Firefox\//u;
const CHROME_USER_AGENT = /Chrome\//u;
const SAFARI_USER_AGENT = /Safari\//u;
const MOBILE_USER_AGENT = /Mobile|Android|iPhone|iPad/u;
const WINDOWS_USER_AGENT = /Windows/u;
const MAC_USER_AGENT = /Macintosh|Mac OS/u;
const LINUX_USER_AGENT = /Linux/u;

function maskIpAddress(value?: string | null): string | null {
	if (!value) {
		return null;
	}
	if (value.includes(":")) {
		const groups = value.split(":").filter(Boolean);
		return groups.length > 1 ? `${groups[0]}:${groups[1]}::/32` : "ipv6";
	}
	const octets = value.split(".");
	return octets.length === 4
		? `${octets[0]}.${octets[1]}.${octets[2]}.x`
		: "masked";
}

function summarizeUserAgent(value?: string | null): {
	deviceLabel: string | null;
	userAgentSummary: string | null;
} {
	if (!value) {
		return { deviceLabel: null, userAgentSummary: null };
	}
	let browser = "Browser";
	if (EDGE_USER_AGENT.test(value)) {
		browser = "Edge";
	} else if (FIREFOX_USER_AGENT.test(value)) {
		browser = "Firefox";
	} else if (CHROME_USER_AGENT.test(value)) {
		browser = "Chrome";
	} else if (SAFARI_USER_AGENT.test(value)) {
		browser = "Safari";
	}
	let device = "Device";
	if (MOBILE_USER_AGENT.test(value)) {
		device = "Mobile device";
	} else if (WINDOWS_USER_AGENT.test(value)) {
		device = "Windows device";
	} else if (MAC_USER_AGENT.test(value)) {
		device = "Mac device";
	} else if (LINUX_USER_AGENT.test(value)) {
		device = "Linux device";
	}
	return {
		deviceLabel: device,
		userAgentSummary: `${browser} on ${device}`,
	};
}

function sessionSummary(
	record: IdentitySessionRecord,
	currentSessionId: string
): SessionSummary {
	const agent = summarizeUserAgent(record.userAgent);
	return {
		createdAt: record.createdAt.toISOString(),
		current: record.id === currentSessionId,
		deviceLabel: agent.deviceLabel,
		expiresAt: record.expiresAt.toISOString(),
		id: record.id,
		ipAddressMasked: maskIpAddress(record.ipAddress),
		updatedAt: record.updatedAt.toISOString(),
		userAgentSummary: agent.userAgentSummary,
	};
}

export function createIdentitySessionApplication(options: {
	clock: () => Date;
	fingerprint: (value: string) => Promise<string>;
	ids: { create: (kind: "event") => string };
	repository: IdentitySessionRepository;
	unitOfWork: IdentitySessionUnitOfWork;
}) {
	return {
		async list(input: {
			authUserId: string;
			currentSessionId: string;
			page: { cursor?: string; limit: number };
		}) {
			const now = options.clock();
			const records = (await options.repository.listOwned(input.authUserId))
				.filter((record) => record.expiresAt > now)
				.sort(
					(left, right) =>
						right.createdAt.getTime() - left.createdAt.getTime() ||
						left.id.localeCompare(right.id)
				);
			const start = input.page.cursor
				? Math.max(
						0,
						records.findIndex((record) => record.id === input.page.cursor) + 1
					)
				: 0;
			const window = records.slice(start, start + input.page.limit + 1);
			const hasNext = window.length > input.page.limit;
			const visible = window.slice(0, input.page.limit);
			return {
				items: visible.map((record) =>
					sessionSummary(record, input.currentSessionId)
				),
				nextCursor: hasNext ? (visible.at(-1)?.id ?? null) : null,
			};
		},

		async revoke(input: {
			authUserId: string;
			correlationId: string;
			currentSessionId: string;
			idempotencyKey: string;
			sessionId: string;
		}): Promise<void> {
			const requestFingerprint = await options.fingerprint(
				JSON.stringify({
					authUserId: input.authUserId,
					sessionId: input.sessionId,
				})
			);
			await options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await repository.findCommandReceipt({
					authUserId: input.authUserId,
					idempotencyKey: input.idempotencyKey,
					operation: "session.revoke",
				});
				if (prior) {
					if (prior.requestFingerprint !== requestFingerprint) {
						throw new IdentitySessionError(
							"idempotency_conflict",
							"The idempotency key is bound to another session revocation"
						);
					}
					return;
				}
				const receipt: IdentitySessionCommandReceipt = {
					authUserId: input.authUserId,
					idempotencyKey: input.idempotencyKey,
					operation: "session.revoke",
					requestFingerprint,
					sessionId: input.sessionId,
				};
				const claim = await repository.claimCommandReceipt(receipt);
				if (!claim.inserted) {
					if (claim.receipt.requestFingerprint !== requestFingerprint) {
						throw new IdentitySessionError(
							"idempotency_conflict",
							"The idempotency key is bound to another session revocation"
						);
					}
					return;
				}
				const owned = await repository.findOwned(
					input.authUserId,
					input.sessionId
				);
				const now = options.clock();
				if (owned) {
					await repository.revokeOwned(input.authUserId, input.sessionId);
					await events.append({
						actorId: input.authUserId,
						aggregateId: input.sessionId,
						capabilityId: "platform.authentication",
						classification: "Confidential",
						correlationId: input.correlationId,
						data: {
							authUserId: input.authUserId,
							current: input.currentSessionId === input.sessionId,
							reasonCode: "user_requested",
							revokedAt: now.toISOString(),
							sessionId: input.sessionId,
						},
						id: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "platform.session.revoked.v1",
						occurredAt: now.toISOString(),
						producerNamespace: "platform",
						purpose: "account-session-security",
						retentionClass: "platform-security-evidence",
						schemaRef: "schemas/events/platform.session.revoked.v1.schema.json",
						schemaVersion: "1.0.0",
						scopeType: "Platform",
						sourceChannel: "api",
					});
				}
				await repository.completeCommandReceipt({
					...receipt,
					completedAt: now,
				});
			});
		},
	};
}
