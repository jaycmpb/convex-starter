import { query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get all work item types (excluding soft-deleted ones).
 * @returns Array of all active work item types.
 */
export const getAllWorkItemTypes = query({
	handler: async (ctx) => {
		return await ctx.db
			.query("workItemTypes")
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();
	},
});

/**
 * Get a work item type by its ID.
 * @param id - The work item type ID.
 * @returns The work item type document or null if not found.
 */
export const getWorkItemTypeById = query({
	args: {
		id: v.id("workItemTypes"),
	},
	handler: async (ctx, args) => {
		const type = await ctx.db.get(args.id);
		if (!type || type.deletedAt) {
			return null;
		}
		return type;
	},
});

/**
 * Get a work item type by its name.
 * @param name - The work item type name.
 * @returns The work item type document or null if not found.
 */
export const getWorkItemTypeByName = query({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const type = await ctx.db
			.query("workItemTypes")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.first();

		if (!type || type.deletedAt) {
			return null;
		}

		return type;
	},
});

/**
 * Get all work items for an account (excluding soft-deleted ones).
 * @param accountId - The account ID.
 * @returns Array of work items for the account.
 */
export const getWorkItemsByAccountId = query({
	args: {
		accountId: v.id("accounts"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workItems")
			.withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
			.filter((q) => q.eq(q.field("_deletionTime"), undefined))
			.collect();
	},
});

/**
 * Get all work items by status for an account.
 * @param accountId - The account ID.
 * @param status - The work item status.
 * @returns Array of work items matching the status.
 */
export const getWorkItemsByAccountIdAndStatus = query({
	args: {
		accountId: v.id("accounts"),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("workItems")
			.withIndex("by_accountId_status", (q) => q.eq("accountId", args.accountId).eq("status", args.status))
			.filter((q) => q.eq(q.field("_deletionTime"), undefined))
			.collect();
	},
});

/**
 * Get a work item by its ID.
 * @param id - The work item ID.
 * @returns The work item document or null if not found.
 */
export const getWorkItemById = query({
	args: {
		id: v.id("workItems"),
	},
	handler: async (ctx, args) => {
		const workItem = await ctx.db.get(args.id);
		if (!workItem || workItem._deletionTime) {
			return null;
		}
		return workItem;
	},
});

/**
 * Get a work item by its external ID.
 * @param externalId - The external system's work item ID.
 * @returns The work item document or null if not found.
 */
export const getWorkItemByExternalId = query({
	args: {
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		const workItem = await ctx.db
			.query("workItems")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (!workItem || workItem._deletionTime) {
			return null;
		}

		return workItem;
	},
});

/**
 * Get all work items for an account with their associated tasks (excluding soft-deleted ones).
 * @param accountId - The account ID.
 * @returns Array of work items with their tasks for the account.
 */
export const getWorkItemsWithTasks = query({
	args: {
		accountId: v.id("accounts"),
	},
	handler: async (ctx, args) => {
		const workItems = await ctx.db
			.query("workItems")
			.withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
			.filter((q) => q.eq(q.field("_deletionTime"), undefined))
			.collect();

		const workItemsWithTasks = await Promise.all(
			workItems.map(async (workItem) => {
				const tasks = await ctx.db
					.query("tasks")
					.withIndex("by_workItemId", (q) => q.eq("workItemId", workItem._id))
					.filter((q) => q.eq(q.field("deletedAt"), undefined))
					.collect();

				return {
					...workItem,
					tasks,
				};
			}),
		);

		return workItemsWithTasks;
	},
});
