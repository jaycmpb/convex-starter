import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Convex Auth tables (authAccounts, authSessions, authRefreshTokens, etc.).
	...authTables,

	settings: defineTable({
		name: v.string(),
		roles: v.array(v.string()),
		integrationSource: v.union(v.literal("airtable"), v.literal("monday"), v.literal("clickup")),
		webhookSecret: v.optional(v.string()),
	}),

	// Custom users table (extends auth users table).
	users: defineTable({
		// Auth Fields
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		phone: v.optional(v.string()),
		phoneVerificationTime: v.optional(v.number()),
		image: v.optional(v.string()),
		isAnonymous: v.optional(v.boolean()),
		// Custom Fields
		role: v.optional(v.string()),
		isStaff: v.optional(v.boolean()),
		externalId: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		selectedAccountId: v.optional(v.id("accounts")),
	})
		.index("email", ["email"])
		.index("phone", ["phone"])
		.index("by_externalId", ["externalId"])
		.index("by_isStaff", ["isStaff"]),

	accounts: defineTable({
		name: v.string(),
		type: v.union(v.literal("personal"), v.literal("business")),
		externalId: v.optional(v.string()),
		deletedAt: v.optional(v.number()),
	})
		.index("by_externalId", ["externalId"])
		.index("by_type", ["type"]),

	accountAccess: defineTable({
		accountId: v.id("accounts"),
		userId: v.id("users"),
	})
		.index("by_accountId", ["accountId"])
		.index("by_userId", ["userId"])
		.index("by_accountId_userId", ["accountId", "userId"]),

	workItemTypes: defineTable({
		name: v.string(),
		statusConfig: v.array(
			v.object({
				status: v.string(),
				progress: v.number(),
			}),
		),
		deletedAt: v.optional(v.number()),
	}).index("by_name", ["name"]),

	workItems: defineTable({
		accountId: v.id("accounts"),
		typeId: v.id("workItemTypes"),
		status: v.string(),
		externalId: v.optional(v.string()),
		name: v.optional(v.string()),
		dueAt: v.optional(v.number()),
		_deletionTime: v.optional(v.number()),
	})
		.index("by_accountId", ["accountId"])
		.index("by_typeId", ["typeId"])
		.index("by_externalId", ["externalId"])
		.index("by_accountId_status", ["accountId", "status"]),

	tasks: defineTable({
		workItemId: v.id("workItems"),
		name: v.string(),
		status: v.string(),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
		externalId: v.optional(v.string()),
		deletedAt: v.optional(v.number()),
	})
		.index("by_workItemId", ["workItemId"])
		.index("by_externalId", ["externalId"])
		.index("by_workItemId_status", ["workItemId", "status"]),

	folders: defineTable({
		accountId: v.id("accounts"),
		parentFolderId: v.optional(v.id("folders")),
		name: v.string(),
		/** Materialized path for fast breadcrumb/ancestor queries. Format: "/folderId1/folderId2/..." */
		path: v.string(),
		/** Depth level (0 = root folder). */
		depth: v.number(),
		deletedAt: v.optional(v.number()),
	})
		.index("by_accountId", ["accountId"])
		.index("by_parentFolderId", ["parentFolderId"])
		.index("by_accountId_parentFolderId", ["accountId", "parentFolderId"])
		.index("by_path", ["path"])
		.index("by_accountId_depth", ["accountId", "depth"]),

	documents: defineTable({
		storageId: v.id("_storage"),
		folderId: v.optional(v.id("folders")),
		accountId: v.optional(v.id("accounts")),
		workItemId: v.optional(v.id("workItems")),
		taskId: v.optional(v.id("tasks")),
		name: v.string(),
		mimeType: v.optional(v.string()),
		size: v.optional(v.number()),
		uploadedBy: v.id("users"),
		deletedAt: v.optional(v.number()),
	})
		.index("by_folderId", ["folderId"])
		.index("by_accountId", ["accountId"])
		.index("by_workItemId", ["workItemId"])
		.index("by_taskId", ["taskId"])
		.index("by_uploadedBy", ["uploadedBy"]),

	notifications: defineTable({
		userId: v.id("users"),
		accountId: v.id("accounts"),
		type: v.union(v.literal("task_assigned"), v.literal("task_completed"), v.literal("task_reminder"), v.literal("task_reopened"), v.literal("workitem_completed")),
		title: v.string(),
		message: v.string(),
		taskId: v.optional(v.id("tasks")),
		workItemId: v.optional(v.id("workItems")),
		readAt: v.optional(v.number()),
		emailSentAt: v.optional(v.number()),
	})
		.index("by_userId", ["userId"])
		.index("by_userId_readAt", ["userId", "readAt"])
		.index("by_accountId", ["accountId"]),
});
