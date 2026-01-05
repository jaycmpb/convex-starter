import { internalQuery, query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get all tasks for a work item (excluding soft-deleted ones).
 * @param workItemId - The work item ID.
 * @returns Array of tasks for the work item.
 */
export const getTasksByWorkItemId = query({
	args: {
		workItemId: v.id("workItems"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tasks")
			.withIndex("by_workItemId", (q) => q.eq("workItemId", args.workItemId))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();
	},
});

/**
 * Get all tasks by status for a work item.
 * @param workItemId - The work item ID.
 * @param status - The task status.
 * @returns Array of tasks matching the status.
 */
export const getTasksByWorkItemIdAndStatus = query({
	args: {
		workItemId: v.id("workItems"),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tasks")
			.withIndex("by_workItemId_status", (q) => q.eq("workItemId", args.workItemId).eq("status", args.status))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();
	},
});

/**
 * Get a task by its ID (internal version for use in actions).
 * @param id - The task ID.
 * @returns The task document or null if not found.
 */
export const getTaskByIdInternal = internalQuery({
	args: {
		id: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			return null;
		}
		return task;
	},
});

/**
 * Get a task by its ID.
 * @param id - The task ID.
 * @returns The task document or null if not found.
 */
export const getTaskById = query({
	args: {
		id: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			return null;
		}
		return task;
	},
});

/**
 * Get a task by its external ID (internal version for use in actions).
 * @param externalId - The external system's task ID.
 * @returns The task document or null if not found.
 */
export const getTaskByExternalIdInternal = internalQuery({
	args: {
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db
			.query("tasks")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (!task || task.deletedAt) {
			return null;
		}

		return task;
	},
});

/**
 * Get a task by its external ID.
 * @param externalId - The external system's task ID.
 * @returns The task document or null if not found.
 */
export const getTaskByExternalId = query({
	args: {
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db
			.query("tasks")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (!task || task.deletedAt) {
			return null;
		}

		return task;
	},
});

/**
 * Get a task by its ID with its associated document (if any).
 * @param id - The task ID.
 * @returns The task document with its associated document, or null if task not found.
 */
export const getTaskWithDocument = query({
	args: {
		id: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			return null;
		}

		const document = await ctx.db
			.query("documents")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.id))
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.first();

		return {
			...task,
			document: document ?? null,
		};
	},
});


/**
 * Get a task's AI analysis by task ID.
 * Staff-only query for viewing document intake intelligence.
 * @param id - The task ID.
 * @returns The AI analysis and pending status, or null if task not found.
 */
export const getTaskAiAnalysis = query({
	args: {
		id: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			return null;
		}

		return {
			analysis: task.aiAnalysis ?? null,
			isPending: task.aiAnalysisPending ?? false,
		};
	},
});

/**
 * Get available status options for tasks.
 * Returns the standard Monday.com task status labels.
 * Note: Colors are fetched via action getTaskStatusOptionsWithColors.
 * @returns Array of task status strings.
 */
export const getStatusOptionsForTask = query({
	handler: async (ctx) => {
		// Return the standard Monday.com task status labels.
		// These match the status labels configured in Monday.com sub-item boards.
		// Colors are fetched separately via the action.
		return ["Started", "Complete", "Open", "Follow-up", "Client Responded", "N/A"];
	},
});
