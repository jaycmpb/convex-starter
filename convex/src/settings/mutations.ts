import { mutation } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Initialize settings for the firm.
 * This should only be called once during setup.
 * @param name - The firm name.
 * @param roles - Array of role names that the firm uses.
 * @param integrationSource - The external tool being integrated (airtable, monday, or clickup).
 * @param webhookSecret - Optional webhook secret for verifying incoming webhooks.
 * @returns The ID of the created settings document.
 */
export const initializeSettings = mutation({
	args: {
		name: v.string(),
		roles: v.array(v.string()),
		integrationSource: v.union(v.literal("airtable"), v.literal("monday"), v.literal("clickup")),
		webhookSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.query("settings").first();
		if (existing) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.CONFLICT,
					message: "Settings already exist. Use updateSettings instead.",
				}),
			);
		}

		return await ctx.db.insert("settings", {
			name: args.name,
			roles: args.roles,
			integrationSource: args.integrationSource,
			webhookSecret: args.webhookSecret,
		});
	},
});

/**
 * Update firm settings.
 * @param name - Optional new firm name.
 * @param roles - Optional new roles array.
 * @param integrationSource - Optional new integration source.
 * @param webhookSecret - Optional new webhook secret.
 * @returns The updated settings document.
 */
export const updateSettings = mutation({
	args: {
		name: v.optional(v.string()),
		roles: v.optional(v.array(v.string())),
		integrationSource: v.optional(v.union(v.literal("airtable"), v.literal("monday"), v.literal("clickup"))),
		webhookSecret: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const settings = await ctx.db.query("settings").first();
		if (!settings) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Settings not found. Initialize settings first.",
				}),
			);
		}

		const updates: {
			name?: string;
			roles?: string[];
			integrationSource?: "airtable" | "monday" | "clickup";
			webhookSecret?: string;
		} = {};

		if (args.name !== undefined) {
			updates.name = args.name;
		}

		if (args.roles !== undefined) {
			updates.roles = args.roles;
		}

		if (args.integrationSource !== undefined) {
			updates.integrationSource = args.integrationSource;
		}

		if (args.webhookSecret !== undefined) {
			updates.webhookSecret = args.webhookSecret;
		}

		await ctx.db.patch(settings._id, updates);

		return await ctx.db.get(settings._id);
	},
});
