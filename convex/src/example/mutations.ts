import { mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a new counter with the specified name and initial value.
 * @param name - The name of the counter.
 * @param value - The initial value of the counter (defaults to 0).
 * @returns The ID of the created counter.
 */
export const createCounter = mutation({
  args: {
    name: v.string(),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("counters", {
      name: args.name,
      value: args.value ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Increment a counter by the specified amount.
 * @param id - The ID of the counter to increment.
 * @param amount - The amount to increment by (defaults to 1).
 * @returns The updated counter document.
 */
export const incrementCounter = mutation({
  args: {
    id: v.id("counters"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const counter = await ctx.db.get(args.id);
    if (!counter) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Counter not found.",
        })
      );
    }

    const incrementAmount = args.amount ?? 1;
    const newValue = counter.value + incrementAmount;

    await ctx.db.patch(args.id, {
      value: newValue,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Decrement a counter by the specified amount.
 * @param id - The ID of the counter to decrement.
 * @param amount - The amount to decrement by (defaults to 1).
 * @returns The updated counter document.
 */
export const decrementCounter = mutation({
  args: {
    id: v.id("counters"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const counter = await ctx.db.get(args.id);
    if (!counter) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Counter not found.",
        })
      );
    }

    const decrementAmount = args.amount ?? 1;
    const newValue = counter.value - decrementAmount;

    await ctx.db.patch(args.id, {
      value: newValue,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Reset a counter to zero.
 * @param id - The ID of the counter to reset.
 * @returns The updated counter document.
 */
export const resetCounter = mutation({
  args: {
    id: v.id("counters"),
  },
  handler: async (ctx, args) => {
    const counter = await ctx.db.get(args.id);
    if (!counter) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Counter not found.",
        })
      );
    }

    await ctx.db.patch(args.id, {
      value: 0,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete a counter from the database.
 * @param id - The ID of the counter to delete.
 * @returns The ID of the deleted counter.
 */
export const deleteCounter = mutation({
  args: {
    id: v.id("counters"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
