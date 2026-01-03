import { internalMutation, mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a notification for a user.
 * @param userId - The user ID.
 * @param accountId - The account ID.
 * @param type - The notification type.
 * @param title - The notification title.
 * @param message - The notification message.
 * @param taskId - Optional task ID.
 * @param workItemId - Optional work item ID.
 * @returns The ID of the created notification.
 */
export const createNotification = internalMutation({
	args: {
		userId: v.id("users"),
		accountId: v.id("accounts"),
		type: v.union(v.literal("task_assigned"), v.literal("task_completed"), v.literal("task_reminder")),
		title: v.string(),
		message: v.string(),
		taskId: v.optional(v.id("tasks")),
		workItemId: v.optional(v.id("workItems")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			userId: args.userId,
			accountId: args.accountId,
			type: args.type,
			title: args.title,
			message: args.message,
			taskId: args.taskId,
			workItemId: args.workItemId,
		});
	},
});

/**
 * Mark a notification as read.
 * @param id - The notification ID.
 * @returns The updated notification document.
 */
export const markNotificationAsRead = mutation({
	args: {
		id: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const notification = await ctx.db.get(args.id);
		if (!notification) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Notification not found.",
				}),
			);
		}

		if (!notification.readAt) {
			await ctx.db.patch(args.id, {
				readAt: Date.now(),
			});
		}

		return await ctx.db.get(args.id);
	},
});

/**
 * Mark all notifications as read for a user.
 * @param userId - The user ID.
 * @returns The number of notifications marked as read.
 */
export const markAllNotificationsAsRead = mutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const unreadNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId_readAt", (q) => q.eq("userId", args.userId).eq("readAt", undefined))
			.collect();

		const now = Date.now();
		for (const notification of unreadNotifications) {
			await ctx.db.patch(notification._id, {
				readAt: now,
			});
		}

		return unreadNotifications.length;
	},
});

/**
 * Delete a notification.
 * @param id - The notification ID.
 * @returns The ID of the deleted notification.
 */
export const deleteNotification = mutation({
	args: {
		id: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const notification = await ctx.db.get(args.id);
		if (!notification) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Notification not found.",
				}),
			);
		}

		await ctx.db.delete(args.id);
		return args.id;
	},
});

/**
 * Mark a notification's email as sent.
 * @param id - The notification ID.
 * @returns The updated notification document.
 */
export const markEmailAsSent = internalMutation({
	args: {
		id: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const notification = await ctx.db.get(args.id);
		if (!notification) {
			return null;
		}

		await ctx.db.patch(args.id, {
			emailSentAt: Date.now(),
		});

		return await ctx.db.get(args.id);
	},
});

