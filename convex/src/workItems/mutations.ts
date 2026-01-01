import type { Id } from "@convex/_generated/dataModel";
import { mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
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
      })
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
        })
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
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const type = await ctx.db.get(args.id);
    if (!type || type.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Work item type not found.",
        })
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
          })
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
 * Create a new work item.
 * @param accountId - The account ID.
 * @param typeId - The work item type ID.
 * @param status - The work item status.
 * @param assignedUserId - Optional assigned user ID.
 * @param externalId - Optional external system ID.
 * @param name - Optional work item name.
 * @param description - Optional description.
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created work item.
 */
export const createWorkItem = mutation({
  args: {
    accountId: v.id("accounts"),
    typeId: v.id("workItemTypes"),
    status: v.string(),
    assignedUserId: v.optional(v.id("users")),
    externalId: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account || account.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Account not found.",
        })
      );
    }

    const type = await ctx.db.get(args.typeId);
    if (!type || type.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Work item type not found.",
        })
      );
    }

    if (args.assignedUserId) {
      const user = await ctx.db.get(args.assignedUserId);
      if (!user) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Assigned user not found.",
          })
        );
      }
    }

    if (args.externalId) {
      const existing = await ctx.db
        .query("workItems")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
        .first();

      if (existing && !existing.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.CONFLICT,
            message: "Work item with this external ID already exists.",
          })
        );
      }
    }

    return await ctx.db.insert("workItems", {
      accountId: args.accountId,
      typeId: args.typeId,
      status: args.status,
      assignedUserId: args.assignedUserId,
      externalId: args.externalId,
      name: args.name,
      description: args.description,
      dueAt: args.dueAt,
    });
  },
});

/**
 * Update a work item.
 * @param id - The work item ID.
 * @param status - Optional new status.
 * @param assignedUserId - Optional new assigned user ID.
 * @param name - Optional new name.
 * @param description - Optional new description.
 * @param dueAt - Optional new due date timestamp.
 * @returns The updated work item document.
 */
export const updateWorkItem = mutation({
  args: {
    id: v.id("workItems"),
    status: v.optional(v.string()),
    assignedUserId: v.optional(v.id("users")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workItem = await ctx.db.get(args.id);
    if (!workItem || workItem.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Work item not found.",
        })
      );
    }

    if (args.assignedUserId) {
      const user = await ctx.db.get(args.assignedUserId);
      if (!user) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Assigned user not found.",
          })
        );
      }
    }

    const updates: {
      status?: string;
      assignedUserId?: Id<"users">;
      name?: string;
      description?: string;
      dueAt?: number;
    } = {};

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    if (args.assignedUserId !== undefined) {
      updates.assignedUserId = args.assignedUserId;
    }

    if (args.name !== undefined) {
      updates.name = args.name;
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
    if (!workItem || workItem.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Work item not found.",
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
 * Upsert a work item by external ID.
 * Useful for webhook ingestion.
 * @param accountId - The account ID.
 * @param typeId - The work item type ID.
 * @param status - The work item status.
 * @param externalId - The external system ID.
 * @param assignedUserId - Optional assigned user ID.
 * @param name - Optional work item name.
 * @param description - Optional description.
 * @param dueAt - Optional due date timestamp.
 * @returns The ID of the created or updated work item.
 */
export const upsertWorkItemByExternalId = mutation({
  args: {
    accountId: v.id("accounts"),
    typeId: v.id("workItemTypes"),
    status: v.string(),
    externalId: v.string(),
    assignedUserId: v.optional(v.id("users")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
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
        assignedUserId: args.assignedUserId,
        name: args.name,
        description: args.description,
        dueAt: args.dueAt,
        deletedAt: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("workItems", {
      accountId: args.accountId,
      typeId: args.typeId,
      status: args.status,
      assignedUserId: args.assignedUserId,
      externalId: args.externalId,
      name: args.name,
      description: args.description,
      dueAt: args.dueAt,
    });
  },
});
