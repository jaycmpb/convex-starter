import { mutation } from "@convex/_generated/server";
import type { Id, Doc } from "@convex/_generated/dataModel";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";


/**
 * Build the materialized path for a folder based on its parent.
 * @param parentPath - The parent folder's path (empty string for root).
 * @param folderId - The current folder's ID.
 * @returns The materialized path string.
 */
function buildPath(parentPath: string, folderId: Id<"folders">): string {
  return parentPath ? `${parentPath}/${folderId}` : `/${folderId}`;
}


/**
 * Create a new folder.
 * @param name - The folder name.
 * @param accountId - The account ID (required for all folders).
 * @param parentFolderId - Optional parent folder ID (for nested folders).
 * @returns The ID of the created folder.
 */
export const createFolder = mutation({
  args: {
    name: v.string(),
    accountId: v.id("accounts"),
    parentFolderId: v.optional(v.id("folders")),
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

    let parentPath = "";
    let depth = 0;

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

      // Ensure parent belongs to same account.
      if (parent.accountId !== args.accountId) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.BAD_REQUEST,
            message: "Parent folder must belong to the same account.",
          })
        );
      }

      parentPath = parent.path;
      depth = parent.depth + 1;
    }

    // Insert with temporary path (we need the ID first).
    const folderId = await ctx.db.insert("folders", {
      accountId: args.accountId,
      parentFolderId: args.parentFolderId,
      name: args.name,
      path: "", // Temporary, will update immediately.
      depth,
    });

    // Update with actual path now that we have the ID.
    const actualPath = buildPath(parentPath, folderId);
    await ctx.db.patch(folderId, { path: actualPath });

    return folderId;
  },
});


/**
 * Update a folder's name.
 * @param id - The folder ID.
 * @param name - The new name.
 * @returns The updated folder document.
 */
export const renameFolder = mutation({
  args: {
    id: v.id("folders"),
    name: v.string(),
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

    await ctx.db.patch(args.id, { name: args.name });
    return await ctx.db.get(args.id);
  },
});


/**
 * Move a folder to a new parent (or to root).
 * Updates the path for this folder and all descendants.
 * @param id - The folder ID to move.
 * @param parentFolderId - The new parent folder ID (null/undefined for root).
 * @returns The updated folder document.
 */
export const moveFolder = mutation({
  args: {
    id: v.id("folders"),
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

    // Cannot move to itself.
    if (args.parentFolderId === args.id) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.BAD_REQUEST,
          message: "A folder cannot be its own parent.",
        })
      );
    }

    let newParentPath = "";
    let newDepth = 0;

    if (args.parentFolderId) {
      const newParent = await ctx.db.get(args.parentFolderId);
      if (!newParent || newParent.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.NOT_FOUND,
            message: "Target parent folder not found.",
          })
        );
      }

      // Ensure parent belongs to same account.
      if (newParent.accountId !== folder.accountId) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.BAD_REQUEST,
            message: "Cannot move folder to a different account.",
          })
        );
      }

      // Cannot move into a descendant (would create a cycle).
      if (newParent.path.startsWith(folder.path + "/") || newParent.path === folder.path) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.BAD_REQUEST,
            message: "Cannot move a folder into its own descendant.",
          })
        );
      }

      newParentPath = newParent.path;
      newDepth = newParent.depth + 1;
    }

    const oldPath = folder.path;
    const newPath = buildPath(newParentPath, args.id);
    const depthDelta = newDepth - folder.depth;

    // Update this folder.
    await ctx.db.patch(args.id, {
      parentFolderId: args.parentFolderId,
      path: newPath,
      depth: newDepth,
    });

    // Update all descendants' paths and depths.
    // Find all folders whose path starts with the old path.
    const descendants = await ctx.db
      .query("folders")
      .filter((q) =>
        q.and(
          q.eq(q.field("deletedAt"), undefined),
          q.neq(q.field("_id"), args.id)
        )
      )
      .collect();

    // Filter descendants manually (path prefix match).
    const descendantFolders = descendants.filter((f) =>
      f.path.startsWith(oldPath + "/")
    );

    for (const descendant of descendantFolders) {
      const updatedPath = newPath + descendant.path.slice(oldPath.length);
      await ctx.db.patch(descendant._id, {
        path: updatedPath,
        depth: descendant.depth + depthDelta,
      });
    }

    return await ctx.db.get(args.id);
  },
});


/**
 * Soft delete a folder and all its contents (subfolders and documents).
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

    const deletedAt = Date.now();

    // Delete this folder.
    await ctx.db.patch(args.id, { deletedAt });

    // Delete all descendant folders.
    const allFolders = await ctx.db
      .query("folders")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const descendantFolders = allFolders.filter((f) =>
      f.path.startsWith(folder.path + "/")
    );

    for (const descendant of descendantFolders) {
      await ctx.db.patch(descendant._id, { deletedAt });
    }

    // Delete all documents in this folder and descendant folders.
    const folderIdsToDelete = [args.id, ...descendantFolders.map((f) => f._id)];

    for (const folderId of folderIdsToDelete) {
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_folderId", (q) => q.eq("folderId", folderId))
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();

      for (const doc of documents) {
        await ctx.db.patch(doc._id, { deletedAt });
      }
    }

    return args.id;
  },
});


/**
 * Restore a soft-deleted folder (and optionally its contents).
 * @param id - The folder ID.
 * @param restoreContents - Whether to restore subfolders and documents too.
 * @returns The restored folder document.
 */
export const restoreFolder = mutation({
  args: {
    id: v.id("folders"),
    restoreContents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Folder not found.",
        })
      );
    }

    if (!folder.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.BAD_REQUEST,
          message: "Folder is not deleted.",
        })
      );
    }

    // If parent is deleted, cannot restore.
    if (folder.parentFolderId) {
      const parent = await ctx.db.get(folder.parentFolderId);
      if (parent?.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.BAD_REQUEST,
            message: "Cannot restore folder because parent folder is deleted.",
          })
        );
      }
    }

    // Restore this folder.
    await ctx.db.patch(args.id, { deletedAt: undefined });

    if (args.restoreContents) {
      // Restore descendant folders.
      const allFolders = await ctx.db.query("folders").collect();
      const descendantFolders = allFolders.filter(
        (f) => f.path.startsWith(folder.path + "/") && f.deletedAt
      );

      for (const descendant of descendantFolders) {
        await ctx.db.patch(descendant._id, { deletedAt: undefined });
      }

      // Restore documents in this folder and descendants.
      const folderIdsToRestore = [args.id, ...descendantFolders.map((f) => f._id)];

      for (const folderId of folderIdsToRestore) {
        const documents = await ctx.db
          .query("documents")
          .withIndex("by_folderId", (q) => q.eq("folderId", folderId))
          .filter((q) => q.neq(q.field("deletedAt"), undefined))
          .collect();

        for (const doc of documents) {
          await ctx.db.patch(doc._id, { deletedAt: undefined });
        }
      }
    }

    return await ctx.db.get(args.id);
  },
});
