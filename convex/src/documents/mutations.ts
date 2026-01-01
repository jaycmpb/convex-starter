import { mutation } from "@convex/_generated/server";
import type { Id } from "@convex/_generated/dataModel";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a new document record.
 * @param storageId - The Convex storage file ID.
 * @param name - The document name.
 * @param uploadedBy - The user ID who uploaded the document.
 * @param folderId - Optional folder ID.
 * @param accountId - Optional account ID.
 * @param workItemId - Optional work item ID.
 * @param taskId - Optional task ID.
 * @param mimeType - Optional MIME type.
 * @param size - Optional file size in bytes.
 * @returns The ID of the created document.
 */
export const createDocument = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    uploadedBy: v.id("users"),
    folderId: v.optional(v.id("folders")),
    accountId: v.optional(v.id("accounts")),
    workItemId: v.optional(v.id("workItems")),
    taskId: v.optional(v.id("tasks")),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.uploadedBy);
    if (!user) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "User not found.",
        })
      );
    }

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Folder not found.",
          })
        );
      }
    }

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

    if (args.workItemId) {
      const workItem = await ctx.db.get(args.workItemId);
      if (!workItem || workItem.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Work item not found.",
          })
        );
      }
    }

    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task || task.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Task not found.",
          })
        );
      }
    }

    return await ctx.db.insert("documents", {
      storageId: args.storageId,
      name: args.name,
      uploadedBy: args.uploadedBy,
      folderId: args.folderId,
      accountId: args.accountId,
      workItemId: args.workItemId,
      taskId: args.taskId,
      mimeType: args.mimeType,
      size: args.size,
    });
  },
});

/**
 * Update a document record.
 * @param id - The document ID.
 * @param name - Optional new name.
 * @param folderId - Optional new folder ID.
 * @returns The updated document.
 */
export const updateDocument = mutation({
  args: {
    id: v.id("documents"),
    name: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document || document.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Document not found.",
        })
      );
    }

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Folder not found.",
          })
        );
      }
    }

    const updates: {
      name?: string;
      folderId?: Id<"folders">;
    } = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.folderId !== undefined) {
      updates.folderId = args.folderId;
    }

    await ctx.db.patch(args.id, updates);

    return await ctx.db.get(args.id);
  },
});

/**
 * Replace a document's file (updates storage ID).
 * Used when a client uploads a new version of a document.
 * @param id - The document ID.
 * @param storageId - The new Convex storage file ID.
 * @param mimeType - Optional new MIME type.
 * @param size - Optional new file size in bytes.
 * @returns The updated document.
 */
export const replaceDocumentFile = mutation({
  args: {
    id: v.id("documents"),
    storageId: v.id("_storage"),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document || document.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Document not found.",
        })
      );
    }

    const updates: {
      storageId: Id<"_storage">;
      mimeType?: string;
      size?: number;
    } = {
      storageId: args.storageId,
    };

    if (args.mimeType !== undefined) {
      updates.mimeType = args.mimeType;
    }

    if (args.size !== undefined) {
      updates.size = args.size;
    }

    await ctx.db.patch(args.id, updates);

    return await ctx.db.get(args.id);
  },
});

/**
 * Soft delete a document.
 * @param id - The document ID.
 * @returns The ID of the deleted document.
 */
export const deleteDocument = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document || document.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Document not found.",
        })
      );
    }

    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
    });

    return args.id;
  },
});

