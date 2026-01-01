import { query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get all folders for an account (excluding soft-deleted ones).
 * @param accountId - The account ID.
 * @returns Array of folders for the account.
 */
export const getFoldersByAccountId = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("folders")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/**
 * Get all subfolders of a parent folder.
 * @param parentFolderId - The parent folder ID.
 * @returns Array of subfolders.
 */
export const getFoldersByParentFolderId = query({
  args: {
    parentFolderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("folders")
      .withIndex("by_parentFolderId", (q) =>
        q.eq("parentFolderId", args.parentFolderId)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/**
 * Get all root folders (no parent) for an account.
 * @param accountId - The account ID.
 * @returns Array of root folders.
 */
export const getRootFoldersByAccountId = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("folders")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) =>
        q.and(
          q.eq(q.field("deletedAt"), undefined),
          q.eq(q.field("parentFolderId"), undefined)
        )
      )
      .collect();
  },
});

/**
 * Get a folder by its ID.
 * @param id - The folder ID.
 * @returns The folder document or null if not found.
 */
export const getFolderById = query({
  args: {
    id: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.deletedAt) {
      return null;
    }
    return folder;
  },
});

