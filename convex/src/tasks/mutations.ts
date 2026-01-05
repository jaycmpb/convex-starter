import { internalMutation, mutation } from "@convex/_generated/server";
import type { Id } from "@convex/_generated/dataModel";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";

/**
 * Create a new task.
 * @param workItemId - The work item ID.
 * @param name - The task name.
 * @param status - The task status.
 * @param description - Optional description.
 * @param dueAt - Optional due date timestamp.
 * @param externalId - Optional external system ID.
 * @returns The ID of the created task.
 */
export const createTask = mutation({
	args: {
		workItemId: v.id("workItems"),
		name: v.string(),
		status: v.string(),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
		externalId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const workItem = await ctx.db.get(args.workItemId);
		if (!workItem || workItem._deletionTime) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item not found.",
				}),
			);
		}

		if (args.externalId) {
			const existing = await ctx.db
				.query("tasks")
				.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
				.first();

			if (existing && !existing.deletedAt) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.CONFLICT,
						message: "Task with this external ID already exists.",
					}),
				);
			}
		}

		return await ctx.db.insert("tasks", {
			workItemId: args.workItemId,
			name: args.name,
			status: args.status,
			description: args.description,
			dueAt: args.dueAt,
			externalId: args.externalId,
		});
	},
});

/**
 * Update a task (internal mutation version for use in actions).
 * @param id - The task ID.
 * @param name - Optional new name.
 * @param status - Optional new status.
 * @param description - Optional new description.
 * @param dueAt - Optional new due date timestamp.
 * @returns The updated task document.
 */
export const updateTaskInternal = internalMutation({
	args: {
		id: v.id("tasks"),
		name: v.optional(v.string()),
		status: v.optional(v.string()),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found.",
				}),
			);
		}

		const updates: {
			name?: string;
			status?: string;
			description?: string;
			dueAt?: number;
		} = {};

		if (args.name !== undefined) {
			updates.name = args.name;
		}

		if (args.status !== undefined) {
			updates.status = args.status;
		}

		if (args.description !== undefined) {
			updates.description = args.description;
		}

		if (args.dueAt !== undefined) {
			updates.dueAt = args.dueAt;
		}

		await ctx.db.patch(args.id, updates);

		const updatedTask = await ctx.db.get(args.id);
		if (!updatedTask) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found after update.",
				}),
			);
		}

		// Check if task was marked as completed.
		const completedStatuses = ["done", "completed", "complete", "closed"];
		const wasIncomplete = !completedStatuses.includes(task.status.toLowerCase());
		const isNowComplete = completedStatuses.includes(updatedTask.status.toLowerCase());

		if (args.status !== undefined) {
			// Get work item to find account ID.
			const workItem = await ctx.db.get(updatedTask.workItemId);
			if (workItem && !workItem._deletionTime) {
				// Check if task was just completed.
				if (wasIncomplete && isNowComplete) {
					await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
						accountId: workItem.accountId,
						type: "task_completed",
						title: "Task Completed",
						message: `The task "${updatedTask.name}" has been marked as complete.`,
						taskId: updatedTask._id,
						workItemId: updatedTask.workItemId,
					});
				}

				// Check if task was reopened (complete → incomplete).
				const wasComplete = completedStatuses.includes(task.status.toLowerCase());
				const isNowIncomplete = !completedStatuses.includes(updatedTask.status.toLowerCase());
				if (wasComplete && isNowIncomplete) {
					await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
						accountId: workItem.accountId,
						type: "task_reopened",
						title: "Task Reopened",
						message: `The task "${updatedTask.name}" has been reopened.`,
						taskId: updatedTask._id,
						workItemId: updatedTask.workItemId,
					});
				}
			}
		}

		return updatedTask;
	},
});

/**
 * Update a task.
 * @param id - The task ID.
 * @param name - Optional new name.
 * @param status - Optional new status.
 * @param description - Optional new description.
 * @param dueAt - Optional new due date timestamp.
 * @returns The updated task document.
 */
export const updateTask = mutation({
	args: {
		id: v.id("tasks"),
		name: v.optional(v.string()),
		status: v.optional(v.string()),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found.",
				}),
			);
		}

		const updates: {
			name?: string;
			status?: string;
			description?: string;
			dueAt?: number;
		} = {};

		if (args.name !== undefined) {
			updates.name = args.name;
		}

		if (args.status !== undefined) {
			updates.status = args.status;
		}

		if (args.description !== undefined) {
			updates.description = args.description;
		}

		if (args.dueAt !== undefined) {
			updates.dueAt = args.dueAt;
		}

		await ctx.db.patch(args.id, updates);

		const updatedTask = await ctx.db.get(args.id);
		if (!updatedTask) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found after update.",
				}),
			);
		}

		// Check if task was marked as completed.
		const completedStatuses = ["done", "completed", "complete", "closed"];
		const wasIncomplete = !completedStatuses.includes(task.status.toLowerCase());
		const isNowComplete = completedStatuses.includes(updatedTask.status.toLowerCase());

		if (args.status !== undefined) {
			// Get work item to find account ID.
			const workItem = await ctx.db.get(updatedTask.workItemId);
			if (workItem && !workItem._deletionTime) {
				// Check if task was just completed.
				if (wasIncomplete && isNowComplete) {
					await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
						accountId: workItem.accountId,
						type: "task_completed",
						title: "Task Completed",
						message: `The task "${updatedTask.name}" has been marked as complete.`,
						taskId: updatedTask._id,
						workItemId: updatedTask.workItemId,
					});
				}

				// Check if task was reopened (complete → incomplete).
				const wasComplete = completedStatuses.includes(task.status.toLowerCase());
				const isNowIncomplete = !completedStatuses.includes(updatedTask.status.toLowerCase());
				if (wasComplete && isNowIncomplete) {
					await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
						accountId: workItem.accountId,
						type: "task_reopened",
						title: "Task Reopened",
						message: `The task "${updatedTask.name}" has been reopened.`,
						taskId: updatedTask._id,
						workItemId: updatedTask.workItemId,
					});
				}
			}
		}

		return updatedTask;
	},
});

/**
 * Soft delete a task.
 * @param id - The task ID.
 * @returns The ID of the deleted task.
 */
export const deleteTask = mutation({
	args: {
		id: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || task.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found.",
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
 * Upsert a task by external ID.
 * Useful for webhook ingestion.
 * @param workItemId - The work item ID.
 * @param name - The task name.
 * @param status - The task status.
 * @param externalId - The external system ID.
 * @param description - Optional description.
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created or updated task.
 */
export const upsertTaskByExternalId = mutation({
	args: {
		workItemId: v.id("workItems"),
		name: v.string(),
		status: v.string(),
		externalId: v.string(),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("tasks")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (existing) {
			const wasCompleted = existing.status.toLowerCase() !== "done" && existing.status.toLowerCase() !== "completed" && existing.status.toLowerCase() !== "closed";
			const isNowCompleted = args.status.toLowerCase() === "done" || args.status.toLowerCase() === "completed" || args.status.toLowerCase() === "closed";

			await ctx.db.patch(existing._id, {
				workItemId: args.workItemId,
				name: args.name,
				status: args.status,
				description: args.description,
				dueAt: args.dueAt,
				deletedAt: undefined,
			});

			// Check if task was just completed.
			if (wasCompleted && isNowCompleted) {
				const workItem = await ctx.db.get(args.workItemId);
				if (workItem && !workItem._deletionTime) {
					await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
						accountId: workItem.accountId,
						type: "task_completed",
						title: "Task Completed",
						message: `The task "${args.name}" has been marked as complete.`,
						taskId: existing._id,
						workItemId: args.workItemId,
					});
				}
			}

			return existing._id;
		}

		const workItem = await ctx.db.get(args.workItemId);
		if (!workItem || workItem._deletionTime) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item not found.",
				}),
			);
		}

		const taskId = await ctx.db.insert("tasks", {
			workItemId: args.workItemId,
			name: args.name,
			status: args.status,
			description: args.description,
			dueAt: args.dueAt,
			externalId: args.externalId,
		});

		// Create notifications for all users with access to the account.
		await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
			accountId: workItem.accountId,
			type: "task_assigned",
			title: "New Task Assigned",
			message: `A new task "${args.name}" has been assigned.`,
			taskId,
			workItemId: args.workItemId,
		});

		return taskId;
	},
});

/**
 * Upsert a task from Monday.com sub-item webhook data.
 * Looks up work item by external ID (parent item ID).
 * @param workItemExternalId - The Monday.com parent item pulse ID.
 * @param externalId - The Monday.com sub-item pulse ID.
 * @param name - The task name.
 * @param status - The Monday.com status label (stored as-is).
 * @param type - Optional task type (document or questionnaire).
 * @param description - Optional task description (Details column).
 * @param dueAt - Optional due date timestamp.
 * @param teamAssigneeExternalId - Optional staff user external ID (Team Assignee column).
 * @returns The ID of the created or updated task, or error if work item not found.
 */
export const upsertTaskFromMonday = internalMutation({
	args: {
		workItemExternalId: v.string(),
		externalId: v.string(),
		name: v.string(),
		status: v.optional(v.string()),
		type: v.optional(v.union(v.literal("document"), v.literal("questionnaire"), v.literal("question"), v.literal("chat"))),
		description: v.optional(v.string()),
		dueAt: v.optional(v.number()),
		teamAssigneeExternalId: v.optional(v.string()),
		templateExternalId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Look up the work item by external ID (parent item).
		const workItem = await ctx.db
			.query("workItems")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.workItemExternalId))
			.first();

		if (!workItem || workItem._deletionTime) {
			return { success: false, error: "Work item not found for parent external ID." };
		}

		const status = args.status ?? "Not Started";

		// Look up team assignee user if explicitly provided.
		// Only resolve if the arg is provided (even if empty string to clear).
		const teamAssigneeProvided = args.teamAssigneeExternalId !== undefined;
		let teamAssigneeId: Id<"users"> | undefined = undefined;
		if (teamAssigneeProvided && args.teamAssigneeExternalId !== "") {
			const teamAssignee = await ctx.db
				.query("users")
				.withIndex("by_externalId", (q) => q.eq("externalId", args.teamAssigneeExternalId))
				.first();
			if (teamAssignee) {
				teamAssigneeId = teamAssignee._id;
			}
		}

		// Look up template if explicitly provided.
		// Only resolve if the arg is provided (even if empty string to clear).
		const templateProvided = args.templateExternalId !== undefined;
		let templateId: Id<"templates"> | undefined = undefined;
		if (templateProvided && args.templateExternalId !== "") {
			const template = await ctx.db
				.query("templates")
				.withIndex("by_externalId", (q) => q.eq("externalId", args.templateExternalId))
				.first();
			if (template && !template.deletedAt) {
				templateId = template._id;
			}
		}

		// Upsert the task.
		const existing = await ctx.db
			.query("tasks")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (existing) {
			const completedStatuses = ["done", "completed", "complete", "closed"];
			const wasIncomplete = !completedStatuses.includes(existing.status.toLowerCase());
			const isNowComplete = completedStatuses.includes(status.toLowerCase());

			console.log("[Task] Status change:", {
				taskId: existing._id,
				taskName: args.name,
				oldStatus: existing.status,
				newStatus: status,
				wasIncomplete,
				isNowComplete,
				willNotify: wasIncomplete && isNowComplete,
			});

			// Build patch object, only including fields that were explicitly provided.
			const patchData: {
				workItemId: Id<"workItems">;
				name: string;
				status: string;
				type?: "document" | "questionnaire" | "question" | "chat";
				description?: string;
				dueAt?: number;
				teamAssigneeId?: Id<"users">;
				templateId?: Id<"templates">;
				deletedAt?: number;
			} = {
				workItemId: workItem._id,
				name: args.name,
				status,
				type: args.type,
				description: args.description,
				dueAt: args.dueAt,
				deletedAt: undefined,
			};

			// Only update teamAssigneeId if it was explicitly provided in the args.
			if (teamAssigneeProvided) {
				patchData.teamAssigneeId = teamAssigneeId;
			}

			// Only update templateId if it was explicitly provided in the args.
			if (templateProvided) {
				patchData.templateId = templateId;
			}

			await ctx.db.patch(existing._id, patchData);

			// Check if task was just completed.
			if (wasIncomplete && isNowComplete) {
				await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
					accountId: workItem.accountId,
					type: "task_completed",
					title: "Task Completed",
					message: `The task "${args.name}" has been marked as complete.`,
					taskId: existing._id,
					workItemId: workItem._id,
				});
			}

			// Check if task was reopened (complete → incomplete).
			const wasComplete = completedStatuses.includes(existing.status.toLowerCase());
			const isNowIncomplete = !completedStatuses.includes(status.toLowerCase());
			if (wasComplete && isNowIncomplete) {
				await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
					accountId: workItem.accountId,
					type: "task_reopened",
					title: "Task Reopened",
					message: `The task "${args.name}" has been reopened.`,
					taskId: existing._id,
					workItemId: workItem._id,
				});
			}

			return { success: true, taskId: existing._id };
		}

		const taskId = await ctx.db.insert("tasks", {
			workItemId: workItem._id,
			name: args.name,
			status,
			type: args.type,
			description: args.description,
			dueAt: args.dueAt,
			externalId: args.externalId,
			teamAssigneeId,
			templateId,
		});

		// Create notifications for all users with access to the account.
		await ctx.scheduler.runAfter(0, internal.src.notifications.helpers.createNotificationsForAccountUsers, {
			accountId: workItem.accountId,
			type: "task_assigned",
			title: "New Task Assigned",
			message: `A new task "${args.name}" has been assigned.`,
			taskId,
			workItemId: workItem._id,
		});

		return { success: true, taskId };
	},
});

/**
 * Create a chat task for a work item (internal mutation).
 * Used by actions to create chat tasks when needed.
 * @param workItemId - The work item ID.
 * @param name - Optional task name (defaults to "Chat").
 * @returns The ID of the created chat task.
 */
export const createChatTaskInternal = internalMutation({
	args: {
		workItemId: v.id("workItems"),
		name: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const workItem = await ctx.db.get(args.workItemId);
		if (!workItem || workItem._deletionTime) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Work item not found.",
				}),
			);
		}

		return await ctx.db.insert("tasks", {
			workItemId: args.workItemId,
			name: args.name ?? "Chat",
			status: "Not Started",
			type: "chat",
		});
	},
});
