import type {
	ClaimedEventReplayRequest,
	CommittedEventEnvelope,
	EventReplayExecutionStorePort,
	EventReplayStoredRequest,
	EventReplayStorePort,
} from "@meridian/platform-events";
import type { Pool, PoolClient } from "pg";

type Connection = Pool | PoolClient;

interface ReplayRow {
	approved_by: string;
	audit_record_id: string;
	compatibility_result: "compatible";
	consumer_id: string;
	consumer_schema_version: string;
	event_names: string[];
	first_sequence: string;
	id: string;
	idempotency_key: string;
	last_sequence: string;
	permission_decision_id: string;
	purpose: string;
	requested_at: Date;
	requested_by: string;
	state: "queued";
	tenant_id: string;
}

interface ReplayEventRow {
	actor_id: string | null;
	aggregate_id: string | null;
	capability_id: string | null;
	causation_id: string | null;
	classification: string;
	correlation_id: string | null;
	data: Record<string, unknown>;
	id: string;
	idempotency_key: string | null;
	legal_entity_id: string | null;
	location_id: string | null;
	name: string;
	occurred_at: Date;
	organization_id: string | null;
	producer_namespace: string;
	purpose: string | null;
	retention_class: string;
	schema_ref: string;
	schema_version: string;
	scope_type: "Tenant" | "Platform";
	source_channel: string | null;
	tenant_id: string | null;
	trace_id: string | null;
}

function toEvent(row: ReplayEventRow): CommittedEventEnvelope {
	return {
		...(row.actor_id ? { actorId: row.actor_id } : {}),
		...(row.aggregate_id ? { aggregateId: row.aggregate_id } : {}),
		...(row.capability_id ? { capabilityId: row.capability_id } : {}),
		...(row.causation_id ? { causationId: row.causation_id } : {}),
		classification: row.classification,
		...(row.correlation_id ? { correlationId: row.correlation_id } : {}),
		data: row.data,
		id: row.id,
		...(row.idempotency_key ? { idempotencyKey: row.idempotency_key } : {}),
		...(row.legal_entity_id ? { legalEntityId: row.legal_entity_id } : {}),
		...(row.location_id ? { locationId: row.location_id } : {}),
		name: row.name,
		occurredAt: row.occurred_at.toISOString(),
		...(row.organization_id ? { organizationId: row.organization_id } : {}),
		producerNamespace: row.producer_namespace,
		...(row.purpose ? { purpose: row.purpose } : {}),
		retentionClass: row.retention_class,
		schemaRef: row.schema_ref,
		schemaVersion: row.schema_version,
		scopeType: row.scope_type,
		...(row.source_channel ? { sourceChannel: row.source_channel } : {}),
		...(row.tenant_id ? { tenantId: row.tenant_id } : {}),
		...(row.trace_id ? { traceId: row.trace_id } : {}),
	} as CommittedEventEnvelope;
}

function toStored(row: ReplayRow): EventReplayStoredRequest {
	return {
		approvedBy: row.approved_by,
		auditRecordId: row.audit_record_id,
		compatibilityResult: row.compatibility_result,
		consumerId: row.consumer_id,
		consumerSchemaVersion: row.consumer_schema_version,
		eventNames: row.event_names,
		firstSequence: row.first_sequence,
		id: row.id,
		idempotencyKey: row.idempotency_key,
		lastSequence: row.last_sequence,
		permissionDecisionId: row.permission_decision_id,
		purpose: row.purpose,
		requestedAt: row.requested_at.toISOString(),
		requestedBy: row.requested_by,
		state: row.state,
		tenantId: row.tenant_id,
	};
}

export function createPostgresReplayStore(
	connection: Connection
): EventReplayStorePort {
	return {
		async createRequest(request) {
			const result = await connection.query<ReplayRow>(
				`INSERT INTO platform_event_replay_request
				 (id, tenant_id, consumer_id, consumer_schema_version, first_sequence,
				  last_sequence, event_names, idempotency_key, purpose, requested_by,
				  approved_by, permission_decision_id, audit_record_id,
				  compatibility_result, state, requested_at)
				 VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16)
				 ON CONFLICT (tenant_id, idempotency_key) DO UPDATE
				 SET idempotency_key = EXCLUDED.idempotency_key
				 RETURNING *`,
				[
					request.id,
					request.tenantId,
					request.consumerId,
					request.consumerSchemaVersion,
					request.firstSequence,
					request.lastSequence,
					JSON.stringify(request.eventNames),
					request.idempotencyKey,
					request.purpose,
					request.requestedBy,
					request.approvedBy,
					request.permissionDecisionId,
					request.auditRecordId,
					request.compatibilityResult,
					request.state,
					request.requestedAt,
				]
			);
			const [stored] = result.rows;
			if (!stored) {
				throw new Error("replay request persistence returned no row");
			}
			const sameRequest =
				stored.consumer_id === request.consumerId &&
				stored.consumer_schema_version === request.consumerSchemaVersion &&
				stored.first_sequence === request.firstSequence &&
				stored.last_sequence === request.lastSequence &&
				stored.purpose === request.purpose &&
				stored.event_names.length === request.eventNames.length &&
				stored.event_names.every(
					(name, index) => name === request.eventNames[index]
				);
			if (!sameRequest) {
				const error = new Error(
					"replay idempotency key conflicts with prior input"
				);
				Object.assign(error, { code: "idempotency_conflict" });
				throw error;
			}
			return toStored(stored);
		},
		async inspectRange(input) {
			const result = await connection.query<{
				count: number;
				event_names: string[] | null;
				event_schema_versions: string[] | null;
				retention_classes: string[] | null;
			}>(
				`SELECT count(*)::int AS count,
				        array_agg(DISTINCT name ORDER BY name) AS event_names,
				        array_agg(DISTINCT schema_version ORDER BY schema_version) AS event_schema_versions,
				        array_agg(DISTINCT retention_class ORDER BY retention_class) AS retention_classes
				 FROM platform_event_outbox
				 WHERE tenant_id = $1
				   AND delivery_sequence BETWEEN $2::bigint AND $3::bigint
				   AND name = ANY($4::text[])`,
				[
					input.tenantId,
					input.firstSequence,
					input.lastSequence,
					input.eventNames,
				]
			);
			const [inspection] = result.rows;
			return {
				count: inspection?.count ?? 0,
				eventNames: inspection?.event_names ?? [],
				eventSchemaVersions: inspection?.event_schema_versions ?? [],
				retentionClasses: inspection?.retention_classes ?? [],
			};
		},
	};
}

export function createPostgresReplayExecutionStore(
	connection: Connection
): EventReplayExecutionStorePort {
	return {
		async claimNext(input) {
			const result = await connection.query<ClaimedEventReplayRequest>(
				`WITH candidate AS (
				   SELECT id FROM platform_event_replay_request
				   WHERE state = 'queued'
				      OR (state = 'running' AND started_at <= $2::timestamptz)
				   ORDER BY requested_at, id
				   FOR UPDATE SKIP LOCKED LIMIT 1
				 )
				 UPDATE platform_event_replay_request AS request
				 SET state = 'running', started_at = $1::timestamptz,
				     completed_at = NULL, failure_code = NULL
				 FROM candidate WHERE request.id = candidate.id
				 RETURNING request.id, request.tenant_id AS "tenantId",
				 request.consumer_id AS "consumerId",
				 request.consumer_schema_version AS "consumerSchemaVersion",
				 request.event_names AS "eventNames",
				 request.first_sequence::text AS "firstSequence",
				 request.last_sequence::text AS "lastSequence"`,
				[input.startedAt, input.reclaimBefore]
			);
			return result.rows[0];
		},
		async complete(input) {
			await connection.query(
				`UPDATE platform_event_replay_request
				 SET state = 'completed', completed_at = $2::timestamptz, failure_code = NULL
				 WHERE id = $1 AND state = 'running'`,
				[input.id, input.completedAt]
			);
		},
		async fail(input) {
			await connection.query(
				`UPDATE platform_event_replay_request
				 SET state = 'failed', completed_at = now(), failure_code = $2
				 WHERE id = $1 AND state = 'running'`,
				[input.id, input.failureCode]
			);
		},
		async loadEvents(request) {
			const result = await connection.query<ReplayEventRow>(
				`SELECT * FROM platform_event_outbox
				 WHERE tenant_id = $1
				   AND delivery_sequence BETWEEN $2::bigint AND $3::bigint
				   AND name = ANY($4::text[])
				 ORDER BY delivery_sequence`,
				[
					request.tenantId,
					request.firstSequence,
					request.lastSequence,
					request.eventNames,
				]
			);
			return result.rows.map(toEvent);
		},
	};
}
