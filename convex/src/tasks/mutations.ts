import { internalMutation, mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
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
        })
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
          })
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
        })
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

    return await ctx.db.get(args.id);
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
        })
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
      await ctx.db.patch(existing._id, {
        workItemId: args.workItemId,
        name: args.name,
        status: args.status,
        description: args.description,
        dueAt: args.dueAt,
        deletedAt: undefined,
      });
      return existing._id;
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
 * Upsert a task from Monday.com sub-item webhook data.
 * Looks up work item by external ID (parent item ID).
 * @param workItemExternalId - The Monday.com parent item pulse ID.
 * @param externalId - The Monday.com sub-item pulse ID.
 * @param name - The task name.
 * @param status - The Monday.com status label (stored as-is).
 * @param description - Optional task description (Details column).
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created or updated task, or error if work item not found.
 */
export const upsertTaskFromMonday = internalMutation({
  args: {
    workItemExternalId: v.string(),
    externalId: v.string(),
    name: v.string(),
    status: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
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

    // Upsert the task.
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        workItemId: workItem._id,
        name: args.name,
        status,
        description: args.description,
        dueAt: args.dueAt,
        deletedAt: undefined,
      });
      return { success: true, taskId: existing._id };
    }

    const taskId = await ctx.db.insert("tasks", {
      workItemId: workItem._id,
      name: args.name,
      status,
      description: args.description,
      dueAt: args.dueAt,
      externalId: args.externalId,
    });

    return { success: true, taskId };
  },
});

