import { randomUUID } from "node:crypto";
import { createPostgresReplayStore } from "@meridian/persistence-platform-events-postgres";
import {
	createEventReplayService,
	WS2_EVENT_CONSUMER_DECLARATIONS,
} from "@meridian/platform-events";

import { auditApplication } from "./audit";
import { permissionAuthorizer } from "./authorization";
import { databasePool } from "./postgres";

const consumers = new Map(
	WS2_EVENT_CONSUMER_DECLARATIONS.map((consumer) => [
		`${consumer.id}@${consumer.schemaVersion}`,
		{
			eventNames: new Set<string>(consumer.eventNames),
			eventSchemaVersions: new Set<string>(consumer.eventSchemaVersions),
			replayRetentionClasses: new Set<string>(consumer.replayRetentionClasses),
		},
	])
);

const replayService = createEventReplayService({
	audit: {
		appendAccepted(input) {
			return auditApplication.append({
				action: "platform.event.replay.requested",
				actorType: "human",
				actorUserId: input.actorUserId,
				changeSummary: { purpose: input.purpose },
				classification: "Confidential",
				correlationId: input.correlationId,
				metadata: { permissionDecisionId: input.decisionId },
				occurredAt: new Date(),
				outcome: "success",
				retentionClass: "platform-security-evidence",
				scopeType: "Tenant",
				sourceChannel: "api",
				sourceEventId: `event-replay:${input.tenantId}:${input.idempotencyKey}`,
				targetId: input.replayRequestId,
				targetType: "EventReplayRequest",
				tenantId: input.tenantId,
			});
		},
	},
	authorization: {
		async decide(input) {
			const decision = await permissionAuthorizer.decide({
				assuranceLevel: "aal1",
				authUserId: input.actorUserId,
				contextId: input.contextId,
				permission: input.permission,
				resourceScope: { scopeId: input.tenantId, scopeType: "Tenant" },
				sessionId: input.sessionId,
			});
			return {
				decisionId: `authorization_decision_${randomUUID()}`,
				outcome: decision.outcome === "allow" ? "allow" : "deny",
			};
		},
	},
	clock: () => new Date(),
	consumers: {
		accepts(input) {
			const accepted = consumers.get(
				`${input.consumerId}@${input.consumerSchemaVersion}`
			);
			return Boolean(
				accepted &&
					input.eventNames.every((eventName) =>
						accepted.eventNames.has(eventName)
					) &&
					(input.eventSchemaVersions ?? []).every((version) =>
						accepted.eventSchemaVersions.has(version)
					) &&
					(input.retentionClasses ?? []).every((retentionClass) =>
						accepted.replayRetentionClasses.has(retentionClass)
					)
			);
		},
	},
	ids: { create: () => `event_replay_${randomUUID()}` },
	store: createPostgresReplayStore(databasePool),
});

export const eventReplayTransportApplication = {
	createEventReplay: (input: {
		actorUserId: string;
		body: {
			consumerId: string;
			consumerSchemaVersion: string;
			eventNames: string[];
			firstSequence: string;
			lastSequence: string;
			purpose: string;
		};
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		tenantId: string;
	}) => replayService.create({ ...input, ...input.body }),
};
