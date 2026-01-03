import { query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get unread notification count for a user.
 * @param userId - The user ID.
 * @returns The count of unread notifications.
 */
export const getUnreadNotificationCount = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const unreadNotifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId_readAt", (q) => q.eq("userId", args.userId).eq("readAt", undefined))
			.collect();

		return unreadNotifications.length;
	},
});

/**
 * Get all notifications for a user, ordered by creation time (newest first).
 * @param userId - The user ID.
 * @param limit - Optional limit on number of notifications to return.
 * @returns Array of notifications.
 */
export const getNotifications = query({
	args: {
		userId: v.id("users"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();

		if (args.limit) {
			return notifications.slice(0, args.limit);
		}

		return notifications;
	},
});

/**
 * Get unread notifications for a user, ordered by creation time (newest first).
 * @param userId - The user ID.
 * @param limit - Optional limit on number of notifications to return.
 * @returns Array of unread notifications.
 */
export const getUnreadNotifications = query({
	args: {
		userId: v.id("users"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_userId_readAt", (q) => q.eq("userId", args.userId).eq("readAt", undefined))
			.order("desc")
			.collect();

		if (args.limit) {
			return notifications.slice(0, args.limit);
		}

		return notifications;
	},
});

/**
 * Get a notification by ID.
 * @param id - The notification ID.
 * @returns The notification document or null if not found.
 */
export const getNotificationById = query({
	args: {
		id: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

