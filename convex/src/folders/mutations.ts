import { mutation } from "@convex/_generated/server";
import type { Id } from "@convex/_generated/dataModel";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a new folder.
 * @param name - The folder name.
 * @param accountId - Optional account ID (for account-level folders).
 * @param parentFolderId - Optional parent folder ID (for nested folders).
 * @returns The ID of the created folder.
 */
export const createFolder = mutation({
  args: {
    name: v.string(),
    accountId: v.optional(v.id("accounts")),
    parentFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    if (args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (!account || account.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Account not found.",
          })
        );
      }
    }

    if (args.parentFolderId) {
      const parent = await ctx.db.get(args.parentFolderId);
      if (!parent || parent.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Parent folder not found.",
          })
        );
      }
    }

    return await ctx.db.insert("folders", {
      accountId: args.accountId,
      parentFolderId: args.parentFolderId,
      name: args.name,
    });
  },
});

/**
 * Update a folder.
 * @param id - The folder ID.
 * @param name - Optional new name.
 * @param parentFolderId - Optional new parent folder ID.
 * @returns The updated folder document.
 */
export const updateFolder = mutation({
  args: {
    id: v.id("folders"),
    name: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Folder not found.",
        })
      );
    }

    if (args.parentFolderId) {
      const parent = await ctx.db.get(args.parentFolderId);
      if (!parent || parent.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Parent folder not found.",
          })
        );
      }

      if (args.parentFolderId === args.id) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.BAD_REQUEST,
            message: "Folder cannot be its own parent.",
          })
        );
      }
    }

    const updates: {
      name?: string;
      parentFolderId?: Id<"folders">;
    } = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.parentFolderId !== undefined) {
      updates.parentFolderId = args.parentFolderId;
    }

    await ctx.db.patch(args.id, updates);

    return await ctx.db.get(args.id);
  },
});

/**
 * Soft delete a folder.
 * @param id - The folder ID.
 * @returns The ID of the deleted folder.
 */
export const deleteFolder = mutation({
  args: {
    id: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Folder not found.",
        })
      );
    }

    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
    });

    return args.id;
  },
});

