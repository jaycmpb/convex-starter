import { internalMutation } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";

/**
 * Helper function to create notifications for all users with access to an account.
 * This is called internally by other mutations.
 * @param accountId - The account ID.
 * @param type - The notification type.
 * @param title - The notification title.
 * @param message - The notification message.
 * @param taskId - Optional task ID.
 * @param workItemId - Optional work item ID.
 */
export const createNotificationsForAccountUsers = internalMutation({
	args: {
		accountId: v.id("accounts"),
		type: v.union(
			v.literal("task_assigned"),
			v.literal("task_completed"),
			v.literal("task_reminder"),
			v.literal("task_reopened"),
			v.literal("workitem_completed"),
		),
		title: v.string(),
		message: v.string(),
		taskId: v.optional(v.id("tasks")),
		workItemId: v.optional(v.id("workItems")),
	},
	handler: async (ctx, args) => {
		// Get all users with access to this account.
		const accountAccessRecords = await ctx.db
			.query("accountAccess")
			.withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
			.collect();

		// Create notifications for each user.
		const notificationIds: string[] = [];
		for (const access of accountAccessRecords) {
			const notificationId = await ctx.db.insert("notifications", {
				userId: access.userId,
				accountId: args.accountId,
				type: args.type,
				title: args.title,
				message: args.message,
				taskId: args.taskId,
				workItemId: args.workItemId,
			});

			notificationIds.push(notificationId);

			// Schedule email sending for each notification.
			const user = await ctx.db.get(access.userId);
			if (user?.email) {
				await ctx.scheduler.runAfter(0, internal.src.notifications.actions.sendNotificationEmail, {
					notificationId,
					userId: access.userId,
					email: user.email,
					firstName: user.firstName,
					type: args.type,
					title: args.title,
					message: args.message,
					taskId: args.taskId,
					workItemId: args.workItemId,
				});
			}
		}

		return notificationIds;
	},
});

