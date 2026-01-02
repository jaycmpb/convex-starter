import { internalMutation, mutation } from "@convex/_generated/server";
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
export const upsertAccountByExternalId = internalMutation({
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
 * @returns The ID of the created access record.
 */
export const grantAccountAccess = mutation({
  args: {
    accountId: v.id("accounts"),
    userId: v.id("users"),
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
    });
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


/**
 * Sync account access from Monday.com linked contacts.
 * Adds access for newly linked contacts and removes access for unlinked contacts.
 * @param accountExternalId - The Monday item ID of the client.
 * @param contactExternalIds - Array of Monday item IDs for linked contacts.
 * @returns Summary of changes made.
 */
export const syncAccountAccessFromMonday = internalMutation({
  args: {
    accountExternalId: v.string(),
    contactExternalIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the account by external ID.
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.accountExternalId)
      )
      .first();

    if (!account || account.deletedAt) {
      return { added: 0, removed: 0, skipped: 0, error: "Account not found." };
    }

    // Get current access records for this account.
    const currentAccess = await ctx.db
      .query("accountAccess")
      .withIndex("by_accountId", (q) => q.eq("accountId", account._id))
      .collect();

    // Map current access by userId for quick lookup.
    const currentUserIds = new Set(
      currentAccess.map((a) => a.userId.toString())
    );

    // Resolve contact external IDs to user IDs.
    const contactUsers = await Promise.all(
      args.contactExternalIds.map(async (externalId) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
          .first();
        return user ? { externalId, userId: user._id } : null;
      })
    );

    const validContactUsers = contactUsers.filter(
      (u): u is NonNullable<typeof u> => u !== null
    );
    const newUserIds = new Set(
      validContactUsers.map((u) => u.userId.toString())
    );

    let added = 0;
    let removed = 0;
    const skipped = args.contactExternalIds.length - validContactUsers.length;

    // Add access for new contacts.
    for (const { userId } of validContactUsers) {
      if (!currentUserIds.has(userId.toString())) {
        await ctx.db.insert("accountAccess", {
          accountId: account._id,
          userId,
        });
        added++;
      }
    }

    // Remove access for unlinked contacts.
    for (const access of currentAccess) {
      if (!newUserIds.has(access.userId.toString())) {
        await ctx.db.delete(access._id);
        removed++;
      }
    }

    return { added, removed, skipped };
  },
});

