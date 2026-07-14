import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	banExpires: timestamp("ban_expires"),
	banned: boolean("banned").default(false),
	banReason: text("ban_reason"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	id: text("id").primaryKey(),
	image: text("image"),
	name: text("name").notNull(),
	role: text("role"),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable(
	"session",
	{
		activeOrganizationId: text("active_organization_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		id: text("id").primaryKey(),
		impersonatedBy: text("impersonated_by"),
		ipAddress: text("ip_address"),
		token: text("token").notNull().unique(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
	"account",
	{
		accessToken: text("access_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		accountId: text("account_id").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		id: text("id").primaryKey(),
		idToken: text("id_token"),
		password: text("password"),
		providerId: text("provider_id").notNull(),
		refreshToken: text("refresh_token"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
	"verification",
	{
		createdAt: timestamp("created_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		value: text("value").notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const twoFactor = pgTable(
	"two_factor",
	{
		backupCodes: text("backup_codes").notNull(),
		failedVerificationCount: integer("failed_verification_count").default(0),
		id: text("id").primaryKey(),
		lockedUntil: timestamp("locked_until"),
		secret: text("secret").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		verified: boolean("verified").default(true),
	},
	(table) => [
		index("twoFactor_secret_idx").on(table.secret),
		index("twoFactor_userId_idx").on(table.userId),
	]
);

export const passkey = pgTable(
	"passkey",
	{
		aaguid: text("aaguid"),
		backedUp: boolean("backed_up").notNull(),
		counter: integer("counter").notNull(),
		createdAt: timestamp("created_at"),
		credentialID: text("credential_id").notNull(),
		deviceType: text("device_type").notNull(),
		id: text("id").primaryKey(),
		name: text("name"),
		publicKey: text("public_key").notNull(),
		transports: text("transports"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("passkey_credentialID_idx").on(table.credentialID),
		index("passkey_userId_idx").on(table.userId),
	]
);

export const organization = pgTable(
	"organization",
	{
		createdAt: timestamp("created_at").notNull(),
		id: text("id").primaryKey(),
		logo: text("logo"),
		metadata: text("metadata"),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
	},
	(table) => [
		index("organization_slug_idx").on(table.slug),
		uniqueIndex("organization_slug_uidx").on(table.slug),
	]
);

export const member = pgTable(
	"member",
	{
		createdAt: timestamp("created_at").notNull(),
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		role: text("role").default("member").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("member_organizationId_idx").on(table.organizationId),
		index("member_userId_idx").on(table.userId),
	]
);

export const invitation = pgTable(
	"invitation",
	{
		createdAt: timestamp("created_at").notNull(),
		email: text("email").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		id: text("id").primaryKey(),
		inviterId: text("inviter_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		role: text("role"),
		status: text("status").default("pending").notNull(),
	},
	(table) => [
		index("invitation_email_idx").on(table.email),
		index("invitation_organizationId_idx").on(table.organizationId),
	]
);

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	members: many(member),
	passkeys: many(passkey),
	sessions: many(session),
	twoFactors: many(twoFactor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id],
	}),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id],
	}),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	invitations: many(invitation),
	members: many(member),
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	inviter: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
	}),
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
}));
