import { action } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for a document.
 * @returns The upload URL and storage ID.
 */
export const generateUploadUrl = action({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a download URL for a document.
 * @param storageId - The Convex storage file ID.
 * @returns The download URL or null if not found.
 */
export const getDownloadUrl = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Delete a file from storage.
 * @param storageId - The Convex storage file ID.
 */
export const deleteStorageFile = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});

