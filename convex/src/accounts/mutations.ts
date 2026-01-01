import { mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a new account.
 * @param name - The account name.
 * @param type - The account type (personal or business).
 * @param externalId - Optional external system ID.
 * @returns The ID of the created account.
 */
export const createAccount = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("business")),
    externalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.externalId) {
      const existing = await ctx.db
        .query("accounts")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
        .first();

      if (existing && !existing.deletedAt) {
        throw new Error(
          JSON.stringify({
            ...ErrorCodes.CONFLICT,
            message: "Account with this external ID already exists.",
          })
        );
      }
    }

    return await ctx.db.insert("accounts", {
      name: args.name,
      type: args.type,
      externalId: args.externalId,
    });
  },
});

/**
 * Update an account.
 * @param id - The account ID.
 * @param name - Optional new name.
 * @param type - Optional new type.
 * @returns The updated account document.
 */
export const updateAccount = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("personal"), v.literal("business"))),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account || account.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Account not found.",
        })
      );
    }

    const updates: {
      name?: string;
      type?: "personal" | "business";
    } = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.type !== undefined) {
      updates.type = args.type;
    }

    await ctx.db.patch(args.id, updates);

    return await ctx.db.get(args.id);
  },
});

/**
 * Soft delete an account.
 * @param id - The account ID.
 * @returns The ID of the deleted account.
 */
export const deleteAccount = mutation({
  args: {
    id: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account || account.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Account not found.",
        })
      );
    }

    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Upsert an account by external ID.
 * Useful for webhook ingestion.
 * @param name - The account name.
 * @param type - The account type.
 * @param externalId - The external system ID.
 * @returns The ID of the created or updated account.
 */
export const upsertAccountByExternalId = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("personal"), v.literal("business")),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        type: args.type,
        deletedAt: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("accounts", {
      name: args.name,
      type: args.type,
      externalId: args.externalId,
    });
  },
});

/**
 * Grant a user access to an account.
 * @param accountId - The account ID.
 * @param userId - The user ID.
 * @param accessLevel - The access level (owner, viewer, or editor).
 * @returns The ID of the created access record.
 */
export const grantAccountAccess = mutation({
  args: {
    accountId: v.id("accounts"),
    userId: v.id("users"),
    accessLevel: v.union(
      v.literal("owner"),
      v.literal("viewer"),
      v.literal("editor")
    ),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account || account.deletedAt) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Account not found.",
        })
      );
    }

    const existing = await ctx.db
      .query("accountAccess")
      .withIndex("by_accountId_userId", (q) =>
        q.eq("accountId", args.accountId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.CONFLICT,
          message: "User already has access to this account.",
        })
      );
    }

    return await ctx.db.insert("accountAccess", {
      accountId: args.accountId,
      userId: args.userId,
      accessLevel: args.accessLevel,
    });
  },
});

/**
 * Update account access level.
 * @param accountId - The account ID.
 * @param userId - The user ID.
 * @param accessLevel - The new access level.
 * @returns The updated access record.
 */
export const updateAccountAccess = mutation({
  args: {
    accountId: v.id("accounts"),
    userId: v.id("users"),
    accessLevel: v.union(
      v.literal("owner"),
      v.literal("viewer"),
      v.literal("editor")
    ),
  },
  handler: async (ctx, args) => {
    const access = await ctx.db
      .query("accountAccess")
      .withIndex("by_accountId_userId", (q) =>
        q.eq("accountId", args.accountId).eq("userId", args.userId)
      )
      .first();

    if (!access) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Account access not found.",
        })
      );
    }

    await ctx.db.patch(access._id, {
      accessLevel: args.accessLevel,
    });

    return await ctx.db.get(access._id);
  },
});

/**
 * Revoke a user's access to an account.
 * @param accountId - The account ID.
 * @param userId - The user ID.
 * @returns The ID of the deleted access record.
 */
export const revokeAccountAccess = mutation({
  args: {
    accountId: v.id("accounts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const access = await ctx.db
      .query("accountAccess")
      .withIndex("by_accountId_userId", (q) =>
        q.eq("accountId", args.accountId).eq("userId", args.userId)
      )
      .first();

    if (!access) {
      throw new Error(
        JSON.stringify({
          ...ErrorCodes.NOT_FOUND,
          message: "Account access not found.",
        })
      );
    }

    await ctx.db.delete(access._id);
    return access._id;
  },
});

