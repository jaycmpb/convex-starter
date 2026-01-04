import { internalAction } from "@convex/_generated/server";
import { TaskAssignedEmail } from "@emails/task/assigned";
import { TaskCompletedEmail } from "@emails/task/completed";
import { TaskReminderEmail } from "@emails/task/reminder";
import { WorkItemCompletedEmail } from "@emails/work-item/completed";
import { render } from "@react-email/render";
import { v } from "convex/values";
import { Resend } from "resend";
import { api } from "@convex/_generated/api";

/**
 * Send a notification email to a user.
 * @param notificationId - The notification ID.
 * @param userId - The user ID.
 * @param email - The user's email address.
 * @param firstName - Optional first name for personalization.
 * @param type - The notification type.
 * @param title - The notification title.
 * @param message - The notification message.
 * @param taskId - Optional task ID.
 * @param workItemId - Optional work item ID.
 */
export const sendNotificationEmail = internalAction({
	args: {
		notificationId: v.id("notifications"),
		userId: v.id("users"),
		email: v.string(),
		firstName: v.optional(v.string()),
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
		const resend = new Resend(process.env.RESEND_API_KEY);

		// Generate the dashboard URL.
		const dashboardUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/dashboard/work-items` : "#";

		// Get task and work item details if available.
		let taskName = "Task";
		let workItemName: string | undefined;
		let workItemType: string | undefined;
		let description: string | undefined;
		let dueAt: number | undefined;
		let completedBy: string | undefined;
		let daysIncomplete: number | undefined;

		if (args.taskId) {
			const task = await ctx.runQuery(api.src.tasks.queries.getTaskById, { id: args.taskId });
			if (task) {
				taskName = task.name;
				description = task.description;
				dueAt = task.dueAt;
			}
		}

		if (args.workItemId) {
			const workItem = await ctx.runQuery(api.src.workItems.queries.getWorkItemById, { id: args.workItemId });
			if (workItem) {
				workItemName = workItem.name || "Work Item";
				// Get work item type name.
				if (workItem.typeId) {
					const workItemTypeDoc = await ctx.runQuery(api.src.workItems.queries.getWorkItemTypeById, { id: workItem.typeId });
					if (workItemTypeDoc) {
						workItemType = workItemTypeDoc.name;
					}
				}
			}
		}

		// Determine email subject and template based on type.
		let subject: string;
		let html: string;

		if (args.type === "task_assigned" || args.type === "task_reopened") {
			subject = args.type === "task_reopened" ? `Task Reopened: ${taskName}` : `New Task Assigned: ${taskName}`;
			html = await render(
				TaskAssignedEmail({
					firstName: args.firstName || "there",
					taskName,
					workItemName,
					dashboardUrl,
					description,
					dueAt,
				}),
			);
		} else if (args.type === "task_completed") {
			subject = `Task Completed: ${taskName}`;
			// For completed tasks, we need to find who completed it.
			// For now, we'll use a generic message.
			completedBy = "Staff";
			html = await render(
				TaskCompletedEmail({
					firstName: args.firstName || "there",
					taskName,
					workItemName,
					dashboardUrl,
					completedBy,
				}),
			);
		} else if (args.type === "task_reminder") {
			subject = `Reminder: ${taskName} Is Still Incomplete`;
			// Calculate days incomplete based on task creation time.
			if (args.taskId) {
				const taskDoc = await ctx.runQuery(api.src.tasks.queries.getTaskById, { id: args.taskId });
				if (taskDoc?._creationTime) {
					daysIncomplete = Math.floor((Date.now() - taskDoc._creationTime) / (24 * 60 * 60 * 1000));
				} else {
					daysIncomplete = 3; // Fallback default.
				}
			} else {
				daysIncomplete = 3; // Fallback default.
			}
			html = await render(
				TaskReminderEmail({
					firstName: args.firstName || "there",
					taskName,
					workItemName,
					dashboardUrl,
					description,
					dueAt,
					daysIncomplete,
				}),
			);
		} else {
			// workitem_completed
			subject = `Work Item Completed: ${workItemName || "Work Item"}`;
			completedBy = "Staff";
			html = await render(
				WorkItemCompletedEmail({
					firstName: args.firstName || "there",
					workItemName: workItemName || "Work Item",
					workItemType,
					dashboardUrl,
					completedBy,
				}),
			);
		}

		const { error } = await resend.emails.send({
			from: "Notifications <no-reply@notifications.ryzeware.com>",
			to: args.email,
			subject,
			html,
		});

		if (error) {
			console.error(`Failed to send notification email to ${args.email}:`, error.message);
			throw new Error(error.message);
		}

		console.log(`Notification email sent to ${args.email} (notification: ${args.notificationId}).`);
	},
});

