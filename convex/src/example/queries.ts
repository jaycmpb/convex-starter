import { query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get all counters from the database.
 * @returns Array of all counters.
 */
export const getAllCounters = query({
  handler: async (ctx) => {
    return await ctx.db.query("counters").collect();
  },
});

/**
 * Get a counter by its name.
 * @param name - The name of the counter to retrieve.
 * @returns The counter document or null if not found.
 */
export const getCounterByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

/**
 * Get a counter by its ID.
 * @param id - The counter ID to retrieve.
 * @returns The counter document or null if not found.
 */
export const getCounterById = query({
  args: {
    id: v.id("counters"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
