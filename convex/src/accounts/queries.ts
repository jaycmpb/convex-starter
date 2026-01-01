import { query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get all accounts (excluding soft-deleted ones).
 * @returns Array of all active accounts.
 */
export const getAllAccounts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("accounts")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/**
 * Get an account by its ID.
 * @param id - The account ID.
 * @returns The account document or null if not found.
 */
export const getAccountById = query({
  args: {
    id: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account || account.deletedAt) {
      return null;
    }
    return account;
  },
});

/**
 * Get an account by its external ID.
 * @param externalId - The external system's account ID.
 * @returns The account document or null if not found.
 */
export const getAccountByExternalId = query({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (!account || account.deletedAt) {
      return null;
    }

    return account;
  },
});

/**
 * Get all accounts of a specific type.
 * @param type - The account type (personal or business).
 * @returns Array of accounts of the specified type.
 */
export const getAccountsByType = query({
  args: {
    type: v.union(v.literal("personal"), v.literal("business")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/**
 * Get all accounts that a user has access to.
 * @param userId - The user ID.
 * @returns Array of accounts the user can access.
 */
export const getAccountsByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const accessRecords = await ctx.db
      .query("accountAccess")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const accountIds = accessRecords.map((access) => access.accountId);
    const accounts = await Promise.all(
      accountIds.map((id) => ctx.db.get(id))
    );

    return accounts.filter(
      (account): account is NonNullable<typeof account> =>
        account !== null && account.deletedAt === undefined
    );
  },
});

/**
 * Get account access records for a specific account.
 * @param accountId - The account ID.
 * @returns Array of access records for the account.
 */
export const getAccountAccessByAccountId = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accountAccess")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .collect();
  },
});

/**
 * Get account access records for a specific user.
 * @param userId - The user ID.
 * @returns Array of access records for the user.
 */
export const getAccountAccessByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accountAccess")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Get a specific account access record.
 * @param accountId - The account ID.
 * @param userId - The user ID.
 * @returns The access record or null if not found.
 */
export const getAccountAccess = query({
  args: {
    accountId: v.id("accounts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accountAccess")
      .withIndex("by_accountId_userId", (q) =>
        q.eq("accountId", args.accountId).eq("userId", args.userId)
      )
      .first();
  },
});

