import { createAccount } from "@convex-dev/auth/server";
import { internal } from "@convex/_generated/api";
import { internalAction } from "@convex/_generated/server";
import { v } from "convex/values";

const splitName = (name: string) => {
	const parts = name.trim().split(" ").filter(Boolean);

	if (parts.length <= 1) {
		return { firstName: parts[0], lastName: undefined };
	}

	const firstName = parts.shift();
	const lastName = parts.join(" ");

	return { firstName, lastName };
};

/**
 * Create or update auth account and app user from Monday.com webhook data.
 * Uses externalId (Monday pulse ID) as the primary key for idempotency.
 * Creates new auth account if user is new OR if email changed.
 */
export const createFromMonday = internalAction({
	args: {
		email: v.string(),
		name: v.string(),
		externalId: v.optional(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const parsedName = splitName(args.name);
		const firstName = args.firstName ?? parsedName.firstName;
		const lastName = args.lastName ?? parsedName.lastName;

		// Check if user already exists by externalId.
		let existingUser = null;
		if (args.externalId) {
			existingUser = await ctx.runQuery(internal.src.users.queries.internalGetUserByExternalId, {
				externalId: args.externalId,
			});
		}

		const isNewUser = !existingUser;

		if (isNewUser) {
			// New user - create auth account.
			await createAccount(ctx, {
				provider: "resend-otp",
				account: { id: args.email },
				profile: { email: args.email },
				shouldLinkViaEmail: true,
			});
		} else if (existingUser && existingUser.email && existingUser.email !== args.email) {
			// Email changed - add new auth account linked to existing auth user.
			await ctx.runMutation(internal.src.users.mutations.addAuthAccountForEmail, {
				oldEmail: existingUser.email,
				newEmail: args.email,
			});
		}

		const userId = await ctx.runMutation(internal.src.users.mutations.ensureUserFromMonday, {
			email: args.email,
			externalId: args.externalId,
			firstName,
			lastName,
			phone: args.phone,
		});

		// Send welcome email to new users.
		if (isNewUser) {
			await ctx.runAction(internal.src.resend.actions.sendWelcomeEmail, {
				userId,
				email: args.email,
				firstName,
			});
		}
	},
});
