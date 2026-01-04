import { internalQuery, query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get all messages for a specific task, ordered by creation time.
 * @param taskId - The task ID.
 * @returns Array of chat messages sorted by creation time.
 */
export const getMessagesByTaskId = query({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const messages = await ctx.db
			.query("chatMessages")
			.withIndex("by_taskId_createdAt", (q) => q.eq("taskId", args.taskId))
			.collect();

		return messages;
	},
});

/**
 * Get a message by its ID (internal version for use in actions).
 * @param id - The message ID.
 * @returns The message document or null if not found.
 */
export const getMessageById = internalQuery({
	args: {
		id: v.id("chatMessages"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

