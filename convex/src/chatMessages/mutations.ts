import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";

/**
 * Send a chat message for a task.
 * Stores the message in Convex and triggers sync to Monday.com.
 * @param taskId - The task ID.
 * @param content - The message content.
 * @param senderName - The sender's display name.
 * @param senderType - The sender type (contact, employee, or ai).
 * @returns The ID of the created message.
 */
export const sendMessage = mutation({
	args: {
		taskId: v.id("tasks"),
		content: v.string(),
		senderName: v.string(),
		senderType: v.union(v.literal("contact"), v.literal("employee"), v.literal("ai")),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found.",
				}),
			);
		}

		if (task.type !== "chat") {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.BAD_REQUEST,
					message: "This task is not a chat task.",
				}),
			);
		}

		const userId = await getAuthUserId(ctx);
		const senderId = userId ? (userId as any) : undefined;

		const messageId = await ctx.db.insert("chatMessages", {
			taskId: args.taskId,
			content: args.content,
			senderType: args.senderType,
			senderName: args.senderName,
			senderId,
			createdAt: Date.now(),
		});

		// Schedule sync to Monday.com if task has external ID.
		if (task.externalId) {
			await ctx.scheduler.runAfter(0, internal.src.chatMessages.actions.syncToMonday, {
				messageId,
				taskExternalId: task.externalId,
				senderName: args.senderName,
				content: args.content,
			});
		}

		return messageId;
	},
});

/**
 * Create a chat message from Monday.com update (internal mutation).
 * Used by webhook handlers to ingest messages from Monday.com.
 * @param taskId - The task ID.
 * @param content - The message content.
 * @param senderName - The sender's display name.
 * @param senderType - The sender type (contact, employee, or ai).
 * @param externalId - The Monday.com update ID for deduplication.
 * @returns The ID of the created message, or null if duplicate.
 */
export const createMessageFromMonday = internalMutation({
	args: {
		taskId: v.id("tasks"),
		content: v.string(),
		senderName: v.string(),
		senderType: v.union(v.literal("contact"), v.literal("employee"), v.literal("ai")),
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		// Check for duplicate by external ID.
		const existing = await ctx.db
			.query("chatMessages")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (existing) {
			return null;
		}

		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found.",
				}),
			);
		}

		return await ctx.db.insert("chatMessages", {
			taskId: args.taskId,
			content: args.content,
			senderType: args.senderType,
			senderName: args.senderName,
			externalId: args.externalId,
			createdAt: Date.now(),
		});
	},
});

/**
 * Update a message's external ID (internal mutation).
 * Used after syncing to Monday.com to store the update ID for deduplication.
 * @param id - The message ID.
 * @param externalId - The Monday.com update ID.
 */
export const updateMessageExternalId = internalMutation({
	args: {
		id: v.id("chatMessages"),
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			externalId: args.externalId,
		});
	},
});

