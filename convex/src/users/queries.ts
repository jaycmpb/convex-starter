import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, query } from "@convex/_generated/server";
import { v } from "convex/values";

/**
 * Get the currently authenticated user.
 * @returns The user document or null if not authenticated.
 */
export const me = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		return await ctx.db.get(userId);
	},
});

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
 * Get a user by their ID (internal version for use in actions).
 * @param id - The user ID.
 * @returns The user document or null if not found.
 */
export const getUserByIdInternal = internalQuery({
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

/**
 * Get the currently authenticated user with their accounts and resolved selected account.
 * Auto-selects the first accessible account if no account is currently selected.
 * @returns The user document with accounts array and resolved selected account, or null if not authenticated.
 */
export const meWithSelectedAccount = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}

		// Get all accounts the user has access to.
		const accessRecords = await ctx.db
			.query("accountAccess")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const accountIds = accessRecords.map((access) => access.accountId);
		const accounts = await Promise.all(accountIds.map((id) => ctx.db.get(id)));

		const accessibleAccounts = accounts.filter((account): account is NonNullable<typeof account> => account !== null && account.deletedAt === undefined);

		// Determine the selected account.
		let selectedAccount = null;
		if (user.selectedAccountId) {
			// Verify the selected account still exists and user has access.
			const account = accessibleAccounts.find((acc) => acc._id === user.selectedAccountId);
			if (account) {
				selectedAccount = account;
			}
		}

		// Auto-select first account if none is selected or the selected account is invalid.
		// Note: This doesn't mutate the user - the frontend should call setSelectedAccount if needed.
		if (!selectedAccount && accessibleAccounts.length > 0) {
			selectedAccount = accessibleAccounts[0];
		}

		return {
			user,
			accounts: accessibleAccounts,
			selectedAccount,
		};
	},
});
