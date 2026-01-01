import { internalQuery, query } from "@convex/_generated/server";
import { v } from "convex/values";


/**
 * Internal query to get a user by their external ID.
 */
export const internalGetUserByExternalId = internalQuery({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

/**
 * Get all users (both staff and clients).
 * @returns Array of all users.
 */
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});


/**
 * Get a user by their email address.
 * @param email - The user's email address.
 * @returns The user document or null if not found.
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});


/**
 * Get a user by their external ID.
 * @param externalId - The external system's user ID (e.g., Monday.com item ID).
 * @returns The user document or null if not found.
 */
export const getUserByExternalId = query({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});


/**
 * Get a user by their ID.
 * @param id - The user ID.
 * @returns The user document or null if not found.
 */
export const getUserById = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});


/**
 * Get all staff users.
 * @returns Array of all staff users.
 */
export const getStaffUsers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_isStaff", (q) => q.eq("isStaff", true))
      .collect();
  },
});


/**
 * Get all client users (non-staff).
 * @returns Array of all client users.
 */
export const getClientUsers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_isStaff", (q) => q.eq("isStaff", false))
      .collect();
  },
});
