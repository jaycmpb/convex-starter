import { internalMutation, mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";

/**
 * Create a new work item type.
 * @param name - The work item type name.
 * @param statusConfig - Array of status configurations with progress percentages.
 * @returns The ID of the created work item type.
 */
export const createWorkItemType = mutation({
	args: {
		name: v.string(),
		statusConfig: v.array(
			v.object({
				status: v.string(),
				progress: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("workItemTypes")
			.withIndex("by_name", (q) => q.eq("name", args.name))
			.first();

		if (existing && !existing.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.CONFLICT,
					message: "Work item type with this name already exists.",
				}),
			);
		}

		return await ctx.db.insert("workItemTypes", {
			name: args.name,
			statusConfig: args.statusConfig,
		});
	},
});

/**
 * Update a work item type.
 * @param id - The work item type ID.
 * @param name - Optional new name.
 * @param statusConfig - Optional new status configuration.
 * @returns The updated work item type document.
 */
export const updateWorkItemType = mutation({
	args: {
		id: v.id("workItemTypes"),
		name: v.optional(v.string()),
		statusConfig: v.optional(
			v.array(
				v.object({
					status: v.string(),
					progress: v.number(),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const type = await ctx.db.get(args.id);
		if (!type || type.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item type not found.",
				}),
			);
		}

		if (args.name && args.name !== type.name) {
			const existing = await ctx.db
				.query("workItemTypes")
				.withIndex("by_name", (q) => q.eq("name", args.name!))
				.first();

			if (existing && !existing.deletedAt) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.CONFLICT,
						message: "Work item type with this name already exists.",
					}),
				);
			}
		}

		const updates: {
			name?: string;
			statusConfig?: Array<{ status: string; progress: number }>;
		} = {};

		if (args.name !== undefined) {
			updates.name = args.name;
		}

		if (args.statusConfig !== undefined) {
			updates.statusConfig = args.statusConfig;
		}

		await ctx.db.patch(args.id, updates);

		return await ctx.db.get(args.id);
	},
});

/**
 * Soft delete a work item type.
 * @param id - The work item type ID.
 * @returns The ID of the deleted work item type.
 */
export const deleteWorkItemType = mutation({
	args: {
		id: v.id("workItemTypes"),
	},
	handler: async (ctx, args) => {
		const type = await ctx.db.get(args.id);
		if (!type || type.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item type not found.",
				}),
			);
		}

		await ctx.db.patch(args.id, {
			deletedAt: Date.now(),
		});

		return args.id;
	},
});

/**
 * Create a new work item.
 * @param accountId - The account ID.
 * @param typeId - The work item type ID.
 * @param status - The work item status.
 * @param externalId - Optional external system ID.
 * @param name - Optional work item name.
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created work item.
 */
export const createWorkItem = mutation({
	args: {
		accountId: v.id("accounts"),
		typeId: v.id("workItemTypes"),
		status: v.string(),
		externalId: v.optional(v.string()),
		name: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const account = await ctx.db.get(args.accountId);
		if (!account || account.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Account not found.",
				}),
			);
		}

		const type = await ctx.db.get(args.typeId);
		if (!type || type.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item type not found.",
				}),
			);
		}

		if (args.externalId) {
			const existing = await ctx.db
				.query("workItems")
				.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
				.first();

			if (existing && !existing._deletionTime) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.CONFLICT,
						message: "Work item with this external ID already exists.",
					}),
				);
			}
		}

		return await ctx.db.insert("workItems", {
			accountId: args.accountId,
			typeId: args.typeId,
			status: args.status,
			externalId: args.externalId,
			name: args.name,
			dueAt: args.dueAt,
		});
	},
});

/**
 * Update a work item.
 * @param id - The work item ID.
 * @param status - Optional new status.
 * @param name - Optional new name.
 * @param dueAt - Optional new due date timestamp.
 * @returns The updated work item document.
 */
export const updateWorkItem = mutation({
	args: {
		id: v.id("workItems"),
		status: v.optional(v.string()),
		name: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const workItem = await ctx.db.get(args.id);
		if (!workItem || workItem._deletionTime) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item not found.",
				}),
			);
		}

		// Track if this update is completing the work item.
		const previousStatus = workItem.status.toLowerCase();
		const wasCompleted = previousStatus === "complete" || previousStatus === "completed" || previousStatus === "done";

		const updates: {
			status?: string;
			name?: string;
			dueAt?: number;
		} = {};

		if (args.status !== undefined) {
			updates.status = args.status;
		}

		if (args.name !== undefined) {
			updates.name = args.name;
		}

		if (args.dueAt !== undefined) {
			updates.dueAt = args.dueAt;
		}

		await ctx.db.patch(args.id, updates);

		const updatedWorkItem = await ctx.db.get(args.id);
		if (!updatedWorkItem) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item not found after update.",
				}),
			);
		}

		// Check if the work item was just completed.
		const newStatus = updatedWorkItem.status.toLowerCase();
		const isNowCompleted = newStatus === "complete" || newStatus === "completed" || newStatus === "done";

		if (!wasCompleted && isNowCompleted && args.status !== undefined) {
			// Create notifications for all users with access to the account.
			await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
				accountId: updatedWorkItem.accountId,
				type: "workitem_completed",
				title: "Work Item Completed",
				message: `The work item "${updatedWorkItem.name || "Work Item"}" has been marked as complete.`,
				workItemId: updatedWorkItem._id,
			});
		}

		return updatedWorkItem;
	},
});

/**
 * Soft delete a work item.
 * @param id - The work item ID.
 * @returns The ID of the deleted work item.
 */
export const deleteWorkItem = mutation({
	args: {
		id: v.id("workItems"),
	},
	handler: async (ctx, args) => {
		const workItem = await ctx.db.get(args.id);
		if (!workItem || workItem._deletionTime) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item not found.",
				}),
			);
		}

		await ctx.db.patch(args.id, {
			_deletionTime: Date.now(),
		});

		return args.id;
	},
});

/**
 * Upsert a work item by external ID.
 * Useful for webhook ingestion.
 * @param accountId - The account ID.
 * @param typeId - The work item type ID.
 * @param status - The work item status.
 * @param externalId - The external system ID.
 * @param name - Optional work item name.
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created or updated work item.
 */
export const upsertWorkItemByExternalId = mutation({
	args: {
		accountId: v.id("accounts"),
		typeId: v.id("workItemTypes"),
		status: v.string(),
		externalId: v.string(),
		name: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("workItems")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				accountId: args.accountId,
				typeId: args.typeId,
				status: args.status,
				name: args.name,
				dueAt: args.dueAt,
				_deletionTime: undefined,
			});
			return existing._id;
		}

		return await ctx.db.insert("workItems", {
			accountId: args.accountId,
			typeId: args.typeId,
			status: args.status,
			externalId: args.externalId,
			name: args.name,
			dueAt: args.dueAt,
		});
	},
});

/**
 * Upsert a work item from Monday.com webhook data.
 * Looks up account by external ID and ensures work item type exists.
 * @param accountExternalId - The Monday.com client pulse ID.
 * @param typeName - The work item type name (e.g., "Personal Tax Returns").
 * @param externalId - The Monday.com work item pulse ID.
 * @param status - The work item status.
 * @param name - Optional work item name.
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created or updated work item, or null if account not found.
 */
export const upsertWorkItemFromMonday = internalMutation({
	args: {
		accountExternalId: v.string(),
		typeName: v.string(),
		externalId: v.string(),
		status: v.string(),
		name: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Look up the account by external ID.
		const account = await ctx.db
			.query("accounts")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.accountExternalId))
			.first();

		if (!account || account.deletedAt) {
			return { success: false, error: "Account not found for client external ID." };
		}

		// Look up or create the work item type.
		let workItemType = await ctx.db
			.query("workItemTypes")
			.withIndex("by_name", (q) => q.eq("name", args.typeName))
			.first();

		if (!workItemType || workItemType.deletedAt) {
			// Create the work item type with default status config.
			const typeId = await ctx.db.insert("workItemTypes", {
				name: args.typeName,
				statusConfig: [
					{ status: "Not Started", progress: 0 },
					{ status: "Waiting for Client", progress: 10 },
					{ status: "Reviewing", progress: 50 },
					{ status: "Ready for Review", progress: 75 },
					{ status: "Complete", progress: 100 },
				],
			});
			workItemType = await ctx.db.get(typeId);
		}

		if (!workItemType) {
			return { success: false, error: "Failed to create work item type." };
		}

		// Upsert the work item.
		const existing = await ctx.db
			.query("workItems")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				accountId: account._id,
				typeId: workItemType._id,
				status: args.status ?? existing.status,
				name: args.name,
				dueAt: args.dueAt,
				_deletionTime: undefined,
			});
			return { success: true, workItemId: existing._id };
		}

		const workItemId = await ctx.db.insert("workItems", {
			accountId: account._id,
			typeId: workItemType._id,
			status: args.status ?? "Not Started",
			externalId: args.externalId,
			name: args.name,
			dueAt: args.dueAt,
		});

		return { success: true, workItemId };
	},
});
