import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "@convex/_generated/server";

/**
 * Get recent activity for a staff member.
 * Aggregates recent tasks completed, documents uploaded, and messages sent by the staff user.
 * @returns Recent activity items sorted by creation time (most recent first).
 */
export const getStaffRecentActivity = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const user = await ctx.db.get(userId);
		if (!user || !user.isStaff) {
			return [];
		}

		const now = Date.now();
		const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

		// Get tasks assigned to this staff member.
		const assignedTasks = await ctx.db
			.query("tasks")
			.withIndex("by_teamAssigneeId", (q) => q.eq("teamAssigneeId", userId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();

		// Get work items for the assigned tasks.
		const workItemIds = [...new Set(assignedTasks.map((task) => task.workItemId))];
		const assignedWorkItems = (
			await Promise.all(
				workItemIds.map(async (workItemId) => {
					const workItem = await ctx.db.get(workItemId);
					return workItem && !workItem._deletionTime ? workItem : null;
				}),
			)
		).filter((wi) => wi !== null);

		// Get recent completed tasks (completed in last 30 days).
		const completedTasks = assignedTasks.filter((task) => {
			const status = task.status.toLowerCase();
			const isCompleted = status === "done" || status === "completed" || status === "complete" || status === "closed";
			return isCompleted && task._creationTime >= thirtyDaysAgo;
		});

		// Get recent documents uploaded by this staff member.
		const recentDocuments = await ctx.db
			.query("documents")
			.withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", userId))
			.filter((q) => q.and(q.eq(q.field("deletedAt"), undefined), q.gte(q.field("_creationTime"), thirtyDaysAgo)))
			.collect();

		// Get recent messages sent by this staff member.
		const recentMessages = await ctx.db
			.query("chatMessages")
			.filter((q) => q.and(q.eq(q.field("senderId"), userId), q.eq(q.field("senderType"), "employee"), q.gte(q.field("createdAt"), thirtyDaysAgo)))
			.collect();

		// Combine and sort by time (most recent first).
		const activities: Array<{
			type: "task_completed" | "document_uploaded" | "message_sent";
			timestamp: number;
			workItemId?: string;
			taskId?: string;
			documentId?: string;
			messageId?: string;
			title: string;
			description?: string;
		}> = [];

		completedTasks.forEach((task) => {
			const workItem = assignedWorkItems.find((wi) => wi._id === task.workItemId);
			activities.push({
				type: "task_completed",
				timestamp: task._creationTime,
				workItemId: workItem?._id,
				taskId: task._id,
				title: `Completed task: ${task.name}`,
				description: workItem?.name ? `Work item: ${workItem.name}` : undefined,
			});
		});

		recentDocuments.forEach((doc) => {
			activities.push({
				type: "document_uploaded",
				timestamp: doc._creationTime,
				documentId: doc._id,
				title: `Uploaded document: ${doc.name}`,
				description: doc.accountId ? `Account: ${doc.accountId}` : undefined,
			});
		});

		recentMessages.forEach((message) => {
			activities.push({
				type: "message_sent",
				timestamp: message.createdAt,
				messageId: message._id,
				taskId: message.taskId,
				title: `Sent message`,
				description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
			});
		});

		// Sort by timestamp (most recent first) and limit to 50 items.
		return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
	},
});

