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

		// Get file URLs for vision analysis.
		const documentsWithUrls = await Promise.all(
			documents.map(async (doc) => {
				const url = await ctx.storage.getUrl(doc.storageId);
				return {
					id: doc._id as Id<"documents">,
					storageId: doc.storageId,
					name: doc.name,
					mimeType: doc.mimeType,
					size: doc.size,
					url,
				};
			}),
		);

		return {
			taskId: task._id,
			taskName: task.name,
			taskDescription: task.description,
			workItemId: workItem._id,
			workItemName: workItem.name,
			workItemTypeName: workItemType.name,
			documents: documentsWithUrls,
		};
	},
});

/**
 * Find or create a chat task for a work item.
 * @param workItemId - The work item ID.
 * @returns The chat task ID.
 */
export const findOrCreateChatTask = internalQuery({
	args: {
		workItemId: v.id("workItems"),
	},
	handler: async (ctx, args) => {
		// Look for existing chat task.
		const existingChatTask = await ctx.db
			.query("tasks")
			.withIndex("by_workItemId", (q) => q.eq("workItemId", args.workItemId))
			.filter((q) => q.and(q.eq(q.field("type"), "chat"), q.eq(q.field("deletedAt"), undefined)))
			.first();

		if (existingChatTask) {
			return existingChatTask._id;
		}

		// No existing chat task found - return null to indicate one needs to be created.
		return null;
	},
});

