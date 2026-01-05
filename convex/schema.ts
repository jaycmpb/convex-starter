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
		role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("member"))),
		isStaff: v.optional(v.boolean()),
		isActive: v.optional(v.boolean()),
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
		type: v.optional(v.union(v.literal("document"), v.literal("questionnaire"), v.literal("question"), v.literal("chat"))),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
		externalId: v.optional(v.string()),
		teamAssigneeId: v.optional(v.id("users")),
		templateId: v.optional(v.id("templates")),
		deletedAt: v.optional(v.number()),
		/** True when AI analysis is currently in progress. */
		aiAnalysisPending: v.optional(v.boolean()),
		/** AI-generated analysis of uploaded documents. Staff-only, not visible to clients. */
		aiAnalysis: v.optional(
			v.object({
				/** Plain-English summary of uploaded documents. */
				summary: v.string(),
				/** Completeness assessment: complete, incomplete, or unclear. */
				completeness: v.union(v.literal("complete"), v.literal("incomplete"), v.literal("unclear")),
				/** List of items that appear to be missing. */
				missingItems: v.array(v.string()),
				/** List of items that seem suspicious or need review. */
				suspiciousItems: v.array(v.string()),
				/** Timestamp of when the analysis was generated. */
				analyzedAt: v.number(),
				/** IDs of documents that were analyzed. */
				analyzedDocumentIds: v.array(v.id("documents")),
				/** Recommended next actions for staff. */
				recommendedActions: v.array(
					v.object({
						type: v.union(v.literal("request_missing_files"), v.literal("mark_complete")),
						label: v.string(),
						data: v.optional(
							v.object({
								missingItems: v.optional(v.array(v.string())),
							}),
						),
					}),
				),
			}),
		),
	})
		.index("by_workItemId", ["workItemId"])
		.index("by_externalId", ["externalId"])
		.index("by_workItemId_status", ["workItemId", "status"])
		.index("by_teamAssigneeId", ["teamAssigneeId"])
		.index("by_templateId", ["templateId"]),

	chatMessages: defineTable({
		taskId: v.id("tasks"),
		content: v.string(),
		senderType: v.union(v.literal("contact"), v.literal("employee"), v.literal("ai")),
		senderName: v.string(),
		senderId: v.optional(v.id("users")),
		externalId: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_taskId", ["taskId"])
		.index("by_externalId", ["externalId"])
		.index("by_taskId_createdAt", ["taskId", "createdAt"]),

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

	templates: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		sections: v.optional(
			v.array(
				v.object({
					id: v.string(),
					title: v.string(),
					description: v.optional(v.string()),
					collapsed: v.optional(v.boolean()),
				}),
			),
		),
		questions: v.array(
			v.object({
				id: v.string(),
				type: v.union(
					v.literal("short_text"),
					v.literal("long_text"),
					v.literal("email"),
					v.literal("phone"),
					v.literal("number"),
					v.literal("date"),
					v.literal("single_choice"),
					v.literal("multiple_choice"),
					v.literal("dropdown"),
					v.literal("consent"),
					v.literal("file_upload"),
					v.literal("signature"),
					v.literal("rating"),
					v.literal("address"),
				),
				title: v.string(),
				description: v.optional(v.string()),
				required: v.boolean(),
				sectionId: v.optional(v.string()),
				options: v.optional(v.array(v.string())),
				validations: v.optional(
					v.object({
						min: v.optional(v.number()),
						max: v.optional(v.number()),
						pattern: v.optional(v.string()),
						minLength: v.optional(v.number()),
						maxLength: v.optional(v.number()),
					}),
				),
				condition: v.optional(
					v.object({
						questionId: v.string(),
						operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("contains")),
						value: v.string(),
					}),
				),
			}),
		),
		locked: v.optional(v.boolean()),
		externalId: v.optional(v.string()),
		createdBy: v.id("users"),
		deletedAt: v.optional(v.number()),
	})
		.index("by_externalId", ["externalId"])
		.index("by_createdBy", ["createdBy"]),

	templateResponses: defineTable({
		taskId: v.id("tasks"),
		templateId: v.id("templates"),
		templateSnapshot: v.optional(
			v.object({
				name: v.string(),
				description: v.optional(v.string()),
				sections: v.optional(
					v.array(
						v.object({
							id: v.string(),
							title: v.string(),
							description: v.optional(v.string()),
							collapsed: v.optional(v.boolean()),
						}),
					),
				),
				questions: v.array(
					v.object({
						id: v.string(),
						type: v.union(
							v.literal("short_text"),
							v.literal("long_text"),
							v.literal("email"),
							v.literal("phone"),
							v.literal("number"),
							v.literal("date"),
							v.literal("single_choice"),
							v.literal("multiple_choice"),
							v.literal("dropdown"),
							v.literal("consent"),
							v.literal("file_upload"),
							v.literal("signature"),
							v.literal("rating"),
							v.literal("address"),
						),
						title: v.string(),
						description: v.optional(v.string()),
						required: v.boolean(),
						sectionId: v.optional(v.string()),
						options: v.optional(v.array(v.string())),
						validations: v.optional(
							v.object({
								min: v.optional(v.number()),
								max: v.optional(v.number()),
								pattern: v.optional(v.string()),
								minLength: v.optional(v.number()),
								maxLength: v.optional(v.number()),
							}),
						),
						condition: v.optional(
							v.object({
								questionId: v.string(),
								operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("contains")),
								value: v.string(),
							}),
						),
					}),
				),
			}),
		),
		answers: v.array(
			v.object({
				questionId: v.string(),
				value: v.any(),
			}),
		),
		currentQuestionIndex: v.number(),
		status: v.union(v.literal("in_progress"), v.literal("completed")),
		completedAt: v.optional(v.number()),
		lastSavedAt: v.number(),
	})
		.index("by_taskId", ["taskId"])
		.index("by_templateId", ["templateId"])
		.index("by_taskId_status", ["taskId", "status"]),
});
