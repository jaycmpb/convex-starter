import { internalMutation, mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a new user.
 * @param email - The user's email address.
 * @param role - The user's role.
 * @param isStaff - Whether the user is staff or a client.
 * @param externalId - Optional external system ID (e.g., Monday.com item ID).
 * @param firstName - Optional first name.
 * @param lastName - Optional last name.
 * @returns The ID of the created user.
 */
export const createUser = mutation({
	args: {
		email: v.string(),
		role: v.string(),
		isStaff: v.boolean(),
		externalId: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existingByEmail = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.first();

		if (existingByEmail) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.CONFLICT,
					message: "User with this email already exists.",
				}),
			);
		}

		if (args.externalId) {
			const existingByExternalId = await ctx.db
				.query("users")
				.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
				.first();

			if (existingByExternalId) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.CONFLICT,
						message: "User with this external ID already exists.",
					}),
				);
			}
		}

		return await ctx.db.insert("users", {
			email: args.email,
			role: args.role,
			isStaff: args.isStaff,
			externalId: args.externalId,
			firstName: args.firstName,
			lastName: args.lastName,
		});
	},
});

/**
 * Update a user.
 * @param id - The user ID.
 * @param email - Optional new email.
 * @param role - Optional new role.
 * @param isStaff - Optional new staff status.
 * @param firstName - Optional new first name.
 * @param lastName - Optional new last name.
 * @returns The updated user document.
 */
export const updateUser = mutation({
	args: {
		id: v.id("users"),
		email: v.optional(v.string()),
		role: v.optional(v.string()),
		isStaff: v.optional(v.boolean()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.id);
		if (!user) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "User not found.",
				}),
			);
		}

		if (args.email && args.email !== user.email) {
			const existingByEmail = await ctx.db
				.query("users")
				.withIndex("email", (q) => q.eq("email", args.email!))
				.first();

			if (existingByEmail) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.CONFLICT,
						message: "User with this email already exists.",
					}),
				);
			}
		}

		const updates: {
			email?: string;
			role?: string;
			isStaff?: boolean;
			firstName?: string;
			lastName?: string;
		} = {};

		if (args.email !== undefined) {
			updates.email = args.email;
		}

		if (args.role !== undefined) {
			updates.role = args.role;
		}

		if (args.isStaff !== undefined) {
			updates.isStaff = args.isStaff;
		}

		if (args.firstName !== undefined) {
			updates.firstName = args.firstName;
		}

		if (args.lastName !== undefined) {
			updates.lastName = args.lastName;
		}

		await ctx.db.patch(args.id, updates);

		return await ctx.db.get(args.id);
	},
});

/**
 * Upsert a user by external ID. Useful for webhook ingestion from Monday.com.
 * @param email - The user's email address.
 * @param role - The user's role.
 * @param isStaff - Whether the user is staff or a client.
 * @param externalId - The external system ID (e.g., Monday.com item ID).
 * @param firstName - Optional first name.
 * @param lastName - Optional last name.
 * @returns The ID of the created or updated user.
 */
export const upsertUserByExternalId = mutation({
	args: {
		email: v.string(),
		role: v.string(),
		isStaff: v.boolean(),
		externalId: v.string(),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("users")
			.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: args.email,
				role: args.role,
				isStaff: args.isStaff,
				firstName: args.firstName,
				lastName: args.lastName,
			});
			return existing._id;
		}

		return await ctx.db.insert("users", {
			email: args.email,
			role: args.role,
			isStaff: args.isStaff,
			externalId: args.externalId,
			firstName: args.firstName,
			lastName: args.lastName,
		});
	},
});

/**
 * Upsert a user from Monday.com webhook data.
 * Uses externalId (Monday pulse ID) as the primary key, falls back to email.
 */
export const ensureUserFromMonday = internalMutation({
	args: {
		email: v.string(),
		externalId: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		console.log(`[ensureUserFromMonday] Called with email=${args.email}, externalId=${args.externalId}`);

		// Primary lookup: by externalId (Monday pulse ID, never changes).
		if (args.externalId) {
			const existingByExternalId = await ctx.db
				.query("users")
				.withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
				.first();

			if (existingByExternalId) {
				console.log(`[ensureUserFromMonday] Found existing user by externalId: ${existingByExternalId._id}`);
				await ctx.db.patch(existingByExternalId._id, {
					email: args.email,
					firstName: args.firstName ?? existingByExternalId.firstName,
					lastName: args.lastName ?? existingByExternalId.lastName,
					phone: args.phone ?? existingByExternalId.phone,
				});
				return existingByExternalId._id;
			}
		}

		// Fallback lookup: by email (for users created before externalId was set).
		const existingByEmail = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.first();

		if (existingByEmail) {
			console.log(`[ensureUserFromMonday] Found existing user by email: ${existingByEmail._id}`);
			await ctx.db.patch(existingByEmail._id, {
				externalId: args.externalId ?? existingByEmail.externalId,
				firstName: args.firstName ?? existingByEmail.firstName,
				lastName: args.lastName ?? existingByEmail.lastName,
				phone: args.phone ?? existingByEmail.phone,
			});
			return existingByEmail._id;
		}

		// Create new user.
		console.log(`[ensureUserFromMonday] Creating new user for email=${args.email}`);
		const userId = await ctx.db.insert("users", {
			email: args.email,
			role: "contact",
			isStaff: false,
			externalId: args.externalId,
			firstName: args.firstName,
			lastName: args.lastName,
			phone: args.phone,
		});

		console.log(`[ensureUserFromMonday] New user created: ${userId}`);
		return userId;
	},
});

/**
 * Replace an auth account's email with a new one.
 * Used when a contact's email changes in Monday.com.
 */
export const addAuthAccountForEmail = internalMutation({
	args: {
		oldEmail: v.string(),
		newEmail: v.string(),
	},
	handler: async (ctx, args) => {
		// Find existing auth account by old email to get the auth user ID.
		const existingAccount = await ctx.db
			.query("authAccounts")
			.filter((q) => q.and(q.eq(q.field("provider"), "resend-otp"), q.eq(q.field("providerAccountId"), args.oldEmail)))
			.first();

		if (!existingAccount) {
			// No auth account for old email - nothing to link to.
			return null;
		}

		// Check if auth account already exists for new email.
		const newEmailAccount = await ctx.db
			.query("authAccounts")
			.filter((q) => q.and(q.eq(q.field("provider"), "resend-otp"), q.eq(q.field("providerAccountId"), args.newEmail)))
			.first();

		if (newEmailAccount) {
			// Auth account already exists for new email - just delete the old one.
			await ctx.db.delete(existingAccount._id);
			return newEmailAccount._id;
		}

		// Create new auth account linked to same auth user.
		// Cast to any since authTables types are managed by Convex Auth.
		const newAccountId = await ctx.db.insert("authAccounts", {
			provider: "resend-otp",
			providerAccountId: args.newEmail,
			userId: existingAccount.userId,
		} as any);

		// Delete the old auth account.
		await ctx.db.delete(existingAccount._id);

		return newAccountId;
	},
});
