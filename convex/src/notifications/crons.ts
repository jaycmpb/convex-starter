import { internal } from "@convex/_generated/api";
import { internalMutation } from "@convex/_generated/server";

/**
 * Check for tasks that have been incomplete for 3+ days and send reminder notifications.
 * This cron job runs daily to check all incomplete tasks.
 */
export const checkOverdueTasks = internalMutation({
	handler: async (ctx) => {
		const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

		// Get all incomplete tasks.
		const allTasks = await ctx.db
			.query("tasks")
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();

		// Filter tasks that are incomplete and were created more than 3 days ago.
		const completedStatuses = ["done", "completed", "complete", "closed"];
		const overdueTasks = allTasks.filter((task) => {
			const status = task.status.toLowerCase();
			const isIncomplete = !completedStatuses.includes(status);
			// Use creation time (_creationTime) to determine how long task has been incomplete.
			// If task was created more than 3 days ago and is still incomplete, send reminder.
			return isIncomplete && task._creationTime < threeDaysAgo;
		});

		// For each overdue task, check if we've already sent a reminder in the last 3 days.
		for (const task of overdueTasks) {
			// Get work item to find account ID.
			const workItem = await ctx.db.get(task.workItemId);
			if (!workItem || workItem._deletionTime) {
				continue;
			}

			// Check if we've already sent a reminder for this task in the last 3 days.
			const recentReminders = await ctx.db
				.query("notifications")
				.withIndex("by_accountId", (q) => q.eq("accountId", workItem.accountId))
				.filter((q) => q.and(q.eq(q.field("type"), "task_reminder"), q.eq(q.field("taskId"), task._id), q.gte(q.field("_creationTime"), threeDaysAgo)))
				.collect();

			// Only send reminder if we haven't sent one in the last 3 days.
			if (recentReminders.length === 0) {
				// Calculate days incomplete.
				const daysIncomplete = Math.floor((Date.now() - task._creationTime) / (24 * 60 * 60 * 1000));

				// Create notifications for all users with access to the account.
				await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
					accountId: workItem.accountId,
					type: "task_reminder",
					title: "Task Reminder",
					message: `The task "${task.name}" has been incomplete for ${daysIncomplete} day${daysIncomplete !== 1 ? "s" : ""}.`,
					taskId: task._id,
					workItemId: task.workItemId,
				});
			}
		}

		console.log(`Checked ${allTasks.length} tasks, found ${overdueTasks.length} overdue tasks.`);
	},
});
