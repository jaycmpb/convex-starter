import { query } from "@convex/_generated/server";
import { v } from "convex/values";


/**
 * Get a document by its ID.
 * @param id - The document ID.
 * @returns The document or null if not found/deleted.
 */
export const getDocumentById = query({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document || document.deletedAt) {
      return null;
    }
    return document;
  },
});


/**
 * Get all documents in a folder (excluding soft-deleted ones).
 * @param folderId - The folder ID.
 * @returns Array of documents in the folder.
 */
export const getDocumentsByFolderId = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Get all documents for an account (excluding soft-deleted ones).
 * @param accountId - The account ID.
 * @returns Array of documents for the account.
 */
export const getDocumentsByAccountId = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Get root-level documents for an account (not in any folder).
 * @param accountId - The account ID.
 * @returns Array of root-level documents.
 */
export const getRootDocuments = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) =>
        q.and(
          q.eq(q.field("deletedAt"), undefined),
          q.eq(q.field("folderId"), undefined)
        )
      )
      .collect();
  },
});


/**
 * Get all documents for a work item (excluding soft-deleted ones).
 * @param workItemId - The work item ID.
 * @returns Array of documents for the work item.
 */
export const getDocumentsByWorkItemId = query({
  args: {
    workItemId: v.id("workItems"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_workItemId", (q) => q.eq("workItemId", args.workItemId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Get all documents for a task (excluding soft-deleted ones).
 * @param taskId - The task ID.
 * @returns Array of documents for the task.
 */
export const getDocumentsByTaskId = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Get all documents uploaded by a user (excluding soft-deleted ones).
 * @param uploadedBy - The user ID.
 * @returns Array of documents uploaded by the user.
 */
export const getDocumentsByUploadedBy = query({
  args: {
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", args.uploadedBy))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Get deleted documents for trash view.
 * @param accountId - The account ID.
 * @returns Array of deleted documents.
 */
export const getDeletedDocuments = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) => q.neq(q.field("deletedAt"), undefined))
      .collect();
  },
});


/**
 * Check if a document name already exists in the same folder.
 * @param folderId - The folder ID (undefined for root).
 * @param accountId - The account ID.
 * @param name - The document name to check.
 * @param excludeDocumentId - Document ID to exclude (for rename operations).
 * @returns True if a document with this name exists.
 */
export const documentNameExists = query({
  args: {
    folderId: v.optional(v.id("folders")),
    accountId: v.id("accounts"),
    name: v.string(),
    excludeDocumentId: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const documents = args.folderId
      ? await ctx.db
          .query("documents")
          .withIndex("by_folderId", (q) => q.eq("folderId", args.folderId))
          .filter((q) => q.eq(q.field("deletedAt"), undefined))
          .collect()
      : await ctx.db
          .query("documents")
          .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
          .filter((q) =>
            q.and(
              q.eq(q.field("deletedAt"), undefined),
              q.eq(q.field("folderId"), undefined)
            )
          )
          .collect();

    return documents.some(
      (d) =>
        d.name.toLowerCase() === args.name.toLowerCase() &&
        d._id !== args.excludeDocumentId
    );
  },
});


/**
 * Search documents by name within an account.
 * @param accountId - The account ID.
 * @param searchTerm - The search term to match against document names.
 * @param limit - Max results to return (default 50).
 * @returns Array of matching documents.
 */
export const searchDocuments = query({
  args: {
    accountId: v.id("accounts"),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const searchLower = args.searchTerm.toLowerCase();

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return documents
      .filter((d) => d.name.toLowerCase().includes(searchLower))
      .slice(0, limit);
  },
});
