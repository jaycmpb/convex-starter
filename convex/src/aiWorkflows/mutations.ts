import { internalMutation } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";

/**
 * Update a task's AI analysis field.
 * Internal mutation called by the AI workflow action.
 * @param taskId - The task ID to update.
 * @param aiAnalysis - The AI analysis data, or undefined to clear.
 */
export const updateTaskAiAnalysis = internalMutation({
	args: {
		taskId: v.id("tasks"),
		aiAnalysis: v.optional(
			v.object({
				summary: v.string(),
				completeness: v.union(v.literal("complete"), v.literal("incomplete"), v.literal("unclear")),
				missingItems: v.array(v.string()),
				suspiciousItems: v.array(v.string()),
				analyzedAt: v.number(),
				analyzedDocumentIds: v.array(v.id("documents")),
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
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt) {
			console.warn(`[AI Analysis] Task ${args.taskId} not found or deleted.`);
			return;
		}

		await ctx.db.patch(args.taskId, {
			aiAnalysis: args.aiAnalysis,
			aiAnalysisPending: false,
		});

		console.log(`[AI Analysis] Updated task ${args.taskId} with analysis.`);
	},
});


/**
 * Send missing files request emails to all users with account access.
 * Schedules emails to be sent in the background.
 * @param taskId - The task ID.
 * @param workItemId - The work item ID.
 * @param accountId - The account ID.
 * @param taskName - The task name.
 * @param workItemName - The work item name (optional).
 * @param missingItems - List of missing items.
 * @param senderName - The name of the staff member sending the request.
 */
export const sendMissingFilesEmail = internalMutation({
	args: {
		taskId: v.id("tasks"),
		workItemId: v.id("workItems"),
		accountId: v.id("accounts"),
		taskName: v.string(),
		workItemName: v.optional(v.string()),
		missingItems: v.array(v.string()),
		senderName: v.string(),
	},
	handler: async (ctx, args) => {
		// Get all users with access to this account.
		const accountAccessRecords = await ctx.db
			.query("accountAccess")
			.withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
			.collect();

		// Schedule email sending for each user.
		for (const access of accountAccessRecords) {
			const user = await ctx.db.get(access.userId);
			if (user?.email) {
				await ctx.scheduler.runAfter(0, internal.src.aiWorkflows.actions.sendMissingFilesRequestEmail, {
					userId: access.userId,
					email: user.email,
					firstName: user.firstName,
					taskId: args.taskId,
					taskName: args.taskName,
					workItemName: args.workItemName,
					missingItems: args.missingItems,
					senderName: args.senderName,
				});
			}
		}

		console.log(`[Missing Files Request] Scheduled emails for ${accountAccessRecords.length} users.`);
	},
});

