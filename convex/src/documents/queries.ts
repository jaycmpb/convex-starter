import { query } from "@convex/_generated/server";
import { v } from "convex/values";

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
 * Get a document by its ID.
 * @param id - The document ID.
 * @returns The document or null if not found.
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

