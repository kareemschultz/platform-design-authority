import { createHash, randomUUID } from "node:crypto";
import { createAuditRepository } from "@meridian/persistence-platform-audit-postgres";
import { createAuditApplication } from "@meridian/platform-audit";

import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const repository = createAuditRepository(databasePool);

export const auditApplication = createAuditApplication({
	clock: () => new Date(),
	hasher: {
		digest: (value) =>
			Promise.resolve(createHash("sha256").update(value).digest("hex")),
	},
	ids: {
		create: (kind) => `audit_${kind.replace("-", "_")}_${randomUUID()}`,
	},
	repository,
	unitOfWork: createPostgresUnitOfWork(databasePool, (client) =>
		createAuditRepository(client)
	),
});

export const auditTransportApplication = {
	listAuditRecords: auditApplication.listTenant,
};
