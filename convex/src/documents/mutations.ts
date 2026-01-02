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
 * @param accountId - Optional account ID (required if no folderId).
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

    let accountId = args.accountId;

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
      // Inherit accountId from folder if not provided.
      accountId = accountId ?? folder.accountId;
    }

    if (accountId) {
      const account = await ctx.db.get(accountId);
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
      if (!workItem || workItem._deletionTime) {
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
      accountId,
      workItemId: args.workItemId,
      taskId: args.taskId,
      mimeType: args.mimeType,
      size: args.size,
    });
  },
});


/**
 * Rename a document.
 * @param id - The document ID.
 * @param name - The new name.
 * @returns The updated document.
 */
export const renameDocument = mutation({
  args: {
    id: v.id("documents"),
    name: v.string(),
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

    await ctx.db.patch(args.id, { name: args.name });
    return await ctx.db.get(args.id);
  },
});


/**
 * Move a document to a different folder.
 * @param id - The document ID.
 * @param folderId - The new folder ID (null/undefined for root level).
 * @returns The updated document.
 */
export const moveDocument = mutation({
  args: {
    id: v.id("documents"),
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

    let newAccountId = document.accountId;

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Target folder not found.",
          })
        );
      }

      // Update accountId to match the folder's account.
      newAccountId = folder.accountId;
    }

    await ctx.db.patch(args.id, {
      folderId: args.folderId,
      accountId: newAccountId,
    });

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

    await ctx.db.patch(args.id, { deletedAt: Date.now() });
    return args.id;
  },
});


/**
 * Restore a soft-deleted document.
 * @param id - The document ID.
 * @returns The restored document.
 */
export const restoreDocument = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Document not found.",
        })
      );
    }

    if (!document.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.BAD_REQUEST,
          message: "Document is not deleted.",
        })
      );
    }

    // If document is in a folder, check that folder isn't deleted.
    if (document.folderId) {
      const folder = await ctx.db.get(document.folderId);
      if (folder?.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.BAD_REQUEST,
            message: "Cannot restore document because its folder is deleted.",
          })
        );
      }
    }

    await ctx.db.patch(args.id, { deletedAt: undefined });
    return await ctx.db.get(args.id);
  },
});


/**
 * Permanently delete a document and its storage file.
 * Use with caution - this cannot be undone.
 * @param id - The document ID.
 * @returns The storage ID that was deleted (caller should delete from storage).
 */
export const permanentlyDeleteDocument = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Document not found.",
        })
      );
    }

    const storageId = document.storageId;
    await ctx.db.delete(args.id);

    return { storageId };
  },
});
