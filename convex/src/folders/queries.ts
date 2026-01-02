import { query } from "@convex/_generated/server";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { v } from "convex/values";


/**
 * Get a folder by its ID.
 * @param id - The folder ID.
 * @returns The folder document or null if not found/deleted.
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


/**
 * Get all root folders (depth = 0) for an account.
 * Uses the depth index for efficient querying.
 * @param accountId - The account ID.
 * @returns Array of root folders.
 */
export const getRootFolders = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("folders")
      .withIndex("by_accountId_depth", (q) =>
        q.eq("accountId", args.accountId).eq("depth", 0)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Get all subfolders of a parent folder.
 * @param parentFolderId - The parent folder ID.
 * @returns Array of direct child folders.
 */
export const getSubfolders = query({
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
 * Get folder contents (subfolders + documents) in a single query.
 * This is the primary query for rendering a folder view.
 * @param folderId - The folder ID (null for root level).
 * @param accountId - The account ID.
 * @param limit - Max items to return per type (default 100).
 * @param cursor - Pagination cursor (currently unused, for future use).
 * @returns Combined subfolders and documents.
 */
export const getFolderContents = query({
  args: {
    folderId: v.optional(v.id("folders")),
    accountId: v.id("accounts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Fetch subfolders and documents in parallel.
    const [subfolders, documents] = await Promise.all([
      args.folderId
        ? ctx.db
            .query("folders")
            .withIndex("by_parentFolderId", (q) =>
              q.eq("parentFolderId", args.folderId)
            )
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .take(limit)
        : ctx.db
            .query("folders")
            .withIndex("by_accountId_depth", (q) =>
              q.eq("accountId", args.accountId).eq("depth", 0)
            )
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .take(limit),

      args.folderId
        ? ctx.db
            .query("documents")
            .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .take(limit)
        : // Root-level documents (no folder) for the account.
          ctx.db
            .query("documents")
            .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
            .filter((q) =>
              q.and(
                q.eq(q.field("deletedAt"), undefined),
                q.eq(q.field("folderId"), undefined)
              )
            )
            .take(limit),
    ]);

    return {
      subfolders,
      documents,
      hasMoreFolders: subfolders.length >= limit,
      hasMoreDocuments: documents.length >= limit,
    };
  },
});


/**
 * Get breadcrumb/ancestor chain for a folder using materialized path.
 * O(n) where n = depth, but uses parallel fetches for speed.
 * @param folderId - The folder ID.
 * @returns Array of ancestor folders from root to current (inclusive).
 */
export const getBreadcrumbs = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.deletedAt) {
      return [];
    }

    // Parse ancestor IDs from the path.
    // Path format: "/folderId1/folderId2/folderId3"
    const pathParts = folder.path.split("/").filter(Boolean);

    if (pathParts.length === 0) {
      return [folder];
    }

    // Fetch all ancestors in parallel.
    const ancestorIds = pathParts.slice(0, -1) as Id<"folders">[];
    const ancestors = await Promise.all(
      ancestorIds.map((id) => ctx.db.get(id))
    );

    // Filter out any null results and add current folder.
    const breadcrumbs = ancestors.filter(
      (f): f is Doc<"folders"> => f !== null && !f.deletedAt
    );

    breadcrumbs.push(folder);

    return breadcrumbs;
  },
});


/**
 * Get all descendant folders of a folder.
 * Uses path prefix matching for efficient querying.
 * @param folderId - The parent folder ID.
 * @returns Array of all descendant folders.
 */
export const getDescendantFolders = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.deletedAt) {
      return [];
    }

    // Get all folders and filter by path prefix.
    // Note: For very large datasets, consider using a search index.
    const allFolders = await ctx.db
      .query("folders")
      .withIndex("by_accountId", (q) => q.eq("accountId", folder.accountId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return allFolders.filter((f) => f.path.startsWith(folder.path + "/"));
  },
});


/**
 * Get all folders for an account (flat list).
 * @param accountId - The account ID.
 * @returns Array of all folders for the account.
 */
export const getAllFolders = query({
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
 * Get deleted folders for trash view.
 * @param accountId - The account ID.
 * @returns Array of deleted folders.
 */
export const getDeletedFolders = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("folders")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) => q.neq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Check if a folder name already exists in the same parent.
 * @param accountId - The account ID.
 * @param name - The folder name to check.
 * @param parentFolderId - The parent folder ID (undefined for root).
 * @param excludeFolderId - Folder ID to exclude (for rename operations).
 * @returns True if a folder with this name exists.
 */
export const folderNameExists = query({
  args: {
    accountId: v.id("accounts"),
    name: v.string(),
    parentFolderId: v.optional(v.id("folders")),
    excludeFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_accountId_parentFolderId", (q) =>
        q.eq("accountId", args.accountId).eq("parentFolderId", args.parentFolderId)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return folders.some(
      (f) =>
        f.name.toLowerCase() === args.name.toLowerCase() &&
        f._id !== args.excludeFolderId
    );
  },
});
