import { createHash } from "node:crypto";
import type {
	ClaimEventInput,
	ClaimedOutboxEvent,
	ConsumerReceiptRecord,
	DeliveryAttemptRecord,
	DeliveryStorePort,
} from "@meridian/platform-events";
import type { Pool, PoolClient, QueryResult } from "pg";

type Connection = Pool | PoolClient;
type DeliveryEvent = ClaimedOutboxEvent["event"];

interface ClaimedRow {
	actor_id: string | null;
	aggregate_id: string | null;
	attempt_count: number;
	capability_id: string | null;
	causation_id: string | null;
	classification: DeliveryEvent["classification"];
	correlation_id: string | null;
	data: Record<string, unknown>;
	delivery_sequence: string;
	first_attempted_at: Date;
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
	scope_type: DeliveryEvent["scopeType"];
	source_channel: string | null;
	tenant_id: string | null;
	trace_id: string | null;
}

function digest(token: string): string {
	return createHash("sha256").update(token, "utf8").digest("hex");
}

function toClaimed(row: ClaimedRow, claimToken: string): ClaimedOutboxEvent {
	const event: DeliveryEvent = {
		...(row.actor_id === null ? {} : { actorId: row.actor_id }),
		...(row.aggregate_id === null ? {} : { aggregateId: row.aggregate_id }),
		...(row.capability_id === null ? {} : { capabilityId: row.capability_id }),
		...(row.causation_id === null ? {} : { causationId: row.causation_id }),
		classification: row.classification,
		...(row.correlation_id === null
			? {}
			: { correlationId: row.correlation_id }),
		data: row.data,
		id: row.id,
		...(row.idempotency_key === null
			? {}
			: { idempotencyKey: row.idempotency_key }),
		...(row.legal_entity_id === null
			? {}
			: { legalEntityId: row.legal_entity_id }),
		...(row.location_id === null ? {} : { locationId: row.location_id }),
		name: row.name,
		occurredAt: row.occurred_at.toISOString(),
		...(row.organization_id === null
			? {}
			: { organizationId: row.organization_id }),
		producerNamespace: row.producer_namespace,
		...(row.purpose === null ? {} : { purpose: row.purpose }),
		retentionClass: row.retention_class,
		schemaRef: row.schema_ref,
		schemaVersion: row.schema_version,
		scopeType: row.scope_type,
		...(row.source_channel === null
			? {}
			: { sourceChannel: row.source_channel }),
		...(row.tenant_id === null ? {} : { tenantId: row.tenant_id }),
		...(row.trace_id === null ? {} : { traceId: row.trace_id }),
	};
	return {
		attemptCount: row.attempt_count,
		claimToken,
		deliverySequence: row.delivery_sequence,
		event,
		firstAttemptedAt: row.first_attempted_at.toISOString(),
	};
}

async function changed(
	connection: Connection,
	text: string,
	values: unknown[]
): Promise<boolean> {
	const result = await connection.query(text, values);
	return result.rowCount === 1;
}

export function createPostgresDeliveryStore(
	connection: Connection
): DeliveryStorePort {
	return {
		async claimNext(input: ClaimEventInput) {
			const result: QueryResult<ClaimedRow> = await connection.query(
				`WITH candidate AS (
					SELECT candidate.id
					FROM platform_event_outbox AS candidate
					WHERE candidate.status IN ('pending', 'retrying', 'claimed')
					  AND candidate.next_attempt_at <= $1::timestamptz
					  AND (candidate.status <> 'claimed' OR candidate.lease_expires_at <= $1::timestamptz)
					  AND NOT EXISTS (
						SELECT 1
						FROM platform_event_outbox AS earlier
						WHERE earlier.scope_key = candidate.scope_key
						  AND earlier.producer_namespace = candidate.producer_namespace
						  AND earlier.aggregate_id IS NOT DISTINCT FROM candidate.aggregate_id
						  AND earlier.delivery_sequence < candidate.delivery_sequence
						  AND earlier.status NOT IN ('delivered', 'dead_lettered')
					  )
					ORDER BY candidate.delivery_sequence
					FOR UPDATE SKIP LOCKED
					LIMIT 1
				)
				UPDATE platform_event_outbox AS claimed
				SET status = 'claimed',
					claim_token_digest = $2,
					claimed_at = $1::timestamptz,
					lease_expires_at = $3::timestamptz,
					first_attempted_at = COALESCE(claimed.first_attempted_at, $1::timestamptz),
					last_attempted_at = $1::timestamptz,
					attempt_count = claimed.attempt_count + 1
				FROM candidate
				WHERE claimed.id = candidate.id
				RETURNING claimed.*`,
				[input.now, digest(input.claimToken), input.leaseExpiresAt]
			);
			const [row] = result.rows;
			return row ? toClaimed(row, input.claimToken) : undefined;
		},
		async hasReceipt(input) {
			const result = await connection.query(
				`SELECT 1 FROM platform_event_consumer_receipt
				 WHERE consumer_id = $1 AND event_id = $2 AND consumer_schema_version = $3`,
				[input.consumerId, input.eventId, input.consumerSchemaVersion]
			);
			return result.rowCount === 1;
		},
		markDeadLettered(input) {
			return changed(
				connection,
				`UPDATE platform_event_outbox
				 SET status = 'dead_lettered', terminal_reason = $3,
				     claim_token_digest = NULL, claimed_at = NULL, lease_expires_at = NULL
				 WHERE id = $1 AND status = 'claimed' AND claim_token_digest = $2`,
				[input.eventId, digest(input.claimToken), input.terminalReason]
			);
		},
		markDelivered(input) {
			return changed(
				connection,
				`UPDATE platform_event_outbox
				 SET status = 'delivered', published_at = $3::timestamptz,
				     claim_token_digest = NULL, claimed_at = NULL, lease_expires_at = NULL,
				     last_error_code = NULL, terminal_reason = NULL
				 WHERE id = $1 AND status = 'claimed' AND claim_token_digest = $2`,
				[input.eventId, digest(input.claimToken), input.publishedAt]
			);
		},
		async recordAttempt(attempt: DeliveryAttemptRecord) {
			await connection.query(
				`INSERT INTO platform_event_delivery_attempt
				 (id, event_id, tenant_id, consumer_id, consumer_schema_version,
				  attempt_number, started_at, finished_at, outcome, reason_code,
				  retry_delay_ms, next_attempt_at)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
				[
					attempt.id,
					attempt.eventId,
					attempt.tenantId,
					attempt.consumerId,
					attempt.consumerSchemaVersion,
					attempt.attemptNumber,
					attempt.startedAt,
					attempt.finishedAt,
					attempt.outcome,
					attempt.reasonCode,
					attempt.retryDelayMs,
					attempt.nextAttemptAt,
				]
			);
		},
		async recordDeadLetter(record) {
			const result = await connection.query(
				`INSERT INTO platform_event_dead_letter
				 (id, event_id, tenant_id, consumer_id, consumer_schema_version,
				  delivery_sequence, envelope_summary, schema_ref, failure_classification,
				  attempt_count, first_attempted_at, last_attempted_at, terminal_reason,
				  retention_class)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
				 ON CONFLICT (event_id, consumer_id, consumer_schema_version) DO NOTHING`,
				[
					record.id,
					record.eventId,
					record.tenantId,
					record.consumerId,
					record.consumerSchemaVersion,
					record.deliverySequence,
					record.envelopeSummary,
					record.schemaRef,
					record.failureClassification,
					record.attemptCount,
					record.firstAttemptedAt,
					record.lastAttemptedAt,
					record.terminalReason,
					record.retentionClass,
				]
			);
			return result.rowCount === 1 ? "inserted" : "duplicate";
		},
		async recordReceipt(receipt: ConsumerReceiptRecord) {
			const result = await connection.query(
				`INSERT INTO platform_event_consumer_receipt
				 (consumer_id, event_id, consumer_schema_version, tenant_id, processed_at,
				  effect_reference, replay_request_id, result_code)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
				 ON CONFLICT (consumer_id, event_id, consumer_schema_version) DO NOTHING`,
				[
					receipt.consumerId,
					receipt.eventId,
					receipt.consumerSchemaVersion,
					receipt.tenantId,
					receipt.processedAt,
					receipt.effectReference,
					receipt.replayRequestId,
					receipt.resultCode,
				]
			);
			return result.rowCount === 1 ? "inserted" : "duplicate";
		},
		releaseForRetry(input) {
			return changed(
				connection,
				`UPDATE platform_event_outbox
				 SET status = 'retrying', next_attempt_at = $3::timestamptz,
				     last_error_code = $4, claim_token_digest = NULL,
				     claimed_at = NULL, lease_expires_at = NULL
				 WHERE id = $1 AND status = 'claimed' AND claim_token_digest = $2`,
				[
					input.eventId,
					digest(input.claimToken),
					input.nextAttemptAt,
					input.reasonCode,
				]
			);
		},
		renewClaim(input) {
			return changed(
				connection,
				`UPDATE platform_event_outbox
				 SET lease_expires_at = $4::timestamptz
				 WHERE id = $1 AND status = 'claimed' AND claim_token_digest = $2
				   AND lease_expires_at > $3::timestamptz`,
				[
					input.eventId,
					digest(input.claimToken),
					input.now,
					input.leaseExpiresAt,
				]
			);
		},
	};
}
