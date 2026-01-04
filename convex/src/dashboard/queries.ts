import { query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get dashboard overview data for an account.
 * Returns aggregated counts and recent items for the dashboard home page.
 * @param accountId - The account ID.
 * @returns Overview data including pending tasks count, recent work items, and recent documents.
 */
export const getOverview = query({
	args: {
		accountId: v.id("accounts"),
	},
	handler: async (ctx, args) => {
		// Get all work items for the account.
		const workItems = await ctx.db
			.query("workItems")
			.withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
			.filter((q) => q.eq(q.field("_deletionTime"), undefined))
			.collect();

		// Get all tasks for these work items.
		const allTasks = await Promise.all(
			workItems.map((workItem) =>
				ctx.db
					.query("tasks")
					.withIndex("by_workItemId", (q) => q.eq("workItemId", workItem._id))
					.filter((q) => q.eq(q.field("deletedAt"), undefined))
					.collect(),
			),
		);

		const tasks = allTasks.flat();

		// Count pending tasks (assuming status !== "done", "completed", "complete", or "closed" means pending).
		const pendingTasks = tasks.filter((task) => {
			const status = task.status.toLowerCase();
			return status !== "done" && status !== "completed" && status !== "complete" && status !== "closed";
		});

		// Get recent work items (last 5).
		const recentWorkItems = workItems
			.sort((a, b) => (b.dueAt ?? 0) - (a.dueAt ?? 0))
			.slice(0, 5);

		// Get recent documents (last 5).
		const allDocuments = await ctx.db
			.query("documents")
			.withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();

		// Sort by _creationTime (most recent first) and take first 5.
		const recentDocuments = allDocuments
			.sort((a, b) => b._creationTime - a._creationTime)
			.slice(0, 5);

		return {
			pendingTasksCount: pendingTasks.length,
			totalTasksCount: tasks.length,
			recentWorkItems,
			recentDocuments,
		};
	},
});

