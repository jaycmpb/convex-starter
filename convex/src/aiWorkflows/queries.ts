import { internalQuery } from "@convex/_generated/server";
import { v } from "convex/values";
import type { Id } from "@convex/_generated/dataModel";

/**
 * Get all context needed for AI document analysis.
 * Fetches task, work item, work item type, and all documents for the task.
 * @param taskId - The task ID to get context for.
 * @returns Task context with documents, or null if task not found.
 */
export const getTaskAnalysisContext = internalQuery({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		// Get the task.
		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt) {
			return null;
		}

		// Get the work item.
		const workItem = await ctx.db.get(task.workItemId);
		if (!workItem || workItem._deletionTime) {
			return null;
		}

		// Get the work item type.
		const workItemType = await ctx.db.get(workItem.typeId);
		if (!workItemType || workItemType.deletedAt) {
			return null;
		}

		// Get all documents for this task.
		const documents = await ctx.db
			.query("documents")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();

		return {
			taskId: task._id,
			taskName: task.name,
			taskDescription: task.description,
			workItemId: workItem._id,
			workItemName: workItem.name,
			workItemTypeName: workItemType.name,
			documents: documents.map((doc) => ({
				id: doc._id as Id<"documents">,
				name: doc.name,
				mimeType: doc.mimeType,
				size: doc.size,
			})),
		};
	},
});

