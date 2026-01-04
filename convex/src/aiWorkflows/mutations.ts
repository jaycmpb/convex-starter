import { internalMutation } from "@convex/_generated/server";
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
		});

		console.log(`[AI Analysis] Updated task ${args.taskId} with analysis.`);
	},
});

