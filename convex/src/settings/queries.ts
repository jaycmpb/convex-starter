import { query } from "@convex/_generated/server";

/**
 * Get the firm settings.
 * Since this is a single-firm system, there should only be one settings record.
 * @returns The settings document or null if not found.
 */
export const getSettings = query({
  handler: async (ctx) => {
    return await ctx.db.query("settings").first();
  },
});

