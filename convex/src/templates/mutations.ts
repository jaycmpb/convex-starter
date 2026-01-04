import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Create a new template.
 * Only staff members can create templates.
 * @param name - The template name.
 * @param description - Optional template description.
 * @param sections - Optional array of section definitions.
 * @param questions - Array of question definitions.
 * @returns The ID of the created template.
 */
export const createTemplate = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		sections: v.optional(
			v.array(
				v.object({
					id: v.string(),
					title: v.string(),
					description: v.optional(v.string()),
					collapsed: v.optional(v.boolean()),
				}),
			),
		),
		questions: v.array(
			v.object({
				id: v.string(),
				type: v.union(
					v.literal("short_text"),
					v.literal("long_text"),
					v.literal("email"),
					v.literal("phone"),
					v.literal("number"),
					v.literal("date"),
					v.literal("single_choice"),
					v.literal("multiple_choice"),
					v.literal("dropdown"),
					v.literal("consent"),
					v.literal("file_upload"),
					v.literal("signature"),
					v.literal("rating"),
					v.literal("address"),
				),
				title: v.string(),
				description: v.optional(v.string()),
				required: v.boolean(),
				sectionId: v.optional(v.string()),
				options: v.optional(v.array(v.string())),
				validations: v.optional(
					v.object({
						min: v.optional(v.number()),
						max: v.optional(v.number()),
						pattern: v.optional(v.string()),
						minLength: v.optional(v.number()),
						maxLength: v.optional(v.number()),
					}),
				),
				condition: v.optional(
					v.object({
						questionId: v.string(),
						operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("contains")),
						value: v.string(),
					}),
				),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.UNAUTHORIZED,
					message: "You must be authenticated to create a template.",
				}),
			);
		}

		const user = await ctx.db.get(userId);
		if (!user || !user.isStaff) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.FORBIDDEN,
					message: "Only staff members can create templates.",
				}),
			);
		}

		const templateId = await ctx.db.insert("templates", {
			name: args.name,
			description: args.description,
			sections: args.sections,
			questions: args.questions,
			createdBy: userId,
		});

		// Sync to Monday.com asynchronously.
		await ctx.scheduler.runAfter(0, internal.src.templates.actions.syncTemplateToMonday, {
			templateId,
		});

		return templateId;
	},
});

/**
 * Update an existing template.
 * Only staff members can update templates.
 * @param id - The template ID.
 * @param name - Optional new name.
 * @param description - Optional new description.
 * @param sections - Optional new sections array.
 * @param questions - Optional new questions array.
 * @returns The updated template document.
 */
export const updateTemplate = mutation({
	args: {
		id: v.id("templates"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		sections: v.optional(
			v.array(
				v.object({
					id: v.string(),
					title: v.string(),
					description: v.optional(v.string()),
					collapsed: v.optional(v.boolean()),
				}),
			),
		),
		questions: v.optional(
			v.array(
				v.object({
					id: v.string(),
					type: v.union(
						v.literal("short_text"),
						v.literal("long_text"),
						v.literal("email"),
						v.literal("phone"),
						v.literal("number"),
						v.literal("date"),
						v.literal("single_choice"),
						v.literal("multiple_choice"),
						v.literal("dropdown"),
						v.literal("consent"),
						v.literal("file_upload"),
						v.literal("signature"),
						v.literal("rating"),
						v.literal("address"),
					),
					title: v.string(),
					description: v.optional(v.string()),
					required: v.boolean(),
					sectionId: v.optional(v.string()),
					options: v.optional(v.array(v.string())),
					validations: v.optional(
						v.object({
							min: v.optional(v.number()),
							max: v.optional(v.number()),
							pattern: v.optional(v.string()),
							minLength: v.optional(v.number()),
							maxLength: v.optional(v.number()),
						}),
					),
					condition: v.optional(
						v.object({
							questionId: v.string(),
							operator: v.union(v.literal("equals"), v.literal("not_equals"), v.literal("contains")),
							value: v.string(),
						}),
					),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.UNAUTHORIZED,
					message: "You must be authenticated to update a template.",
				}),
			);
		}

		const user = await ctx.db.get(userId);
		if (!user || !user.isStaff) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.FORBIDDEN,
					message: "Only staff members can update templates.",
				}),
			);
		}

		const template = await ctx.db.get(args.id);
		if (!template || template.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Template not found.",
				}),
			);
		}

	const updates: {
		name?: string;
		description?: string;
		sections?: Array<{
			id: string;
			title: string;
			description?: string;
			collapsed?: boolean;
		}>;
		questions?: Array<{
			id: string;
			type:
				| "short_text"
				| "long_text"
				| "email"
				| "phone"
				| "number"
				| "date"
				| "single_choice"
				| "multiple_choice"
				| "dropdown"
				| "consent"
				| "file_upload"
				| "signature"
				| "rating"
				| "address";
			title: string;
			description?: string;
			required: boolean;
			sectionId?: string;
			options?: string[];
			validations?: {
				min?: number;
				max?: number;
				pattern?: string;
				minLength?: number;
				maxLength?: number;
			};
			condition?: {
				questionId: string;
				operator: "equals" | "not_equals" | "contains";
				value: string;
			};
		}>;
	} = {};

		if (args.name !== undefined) {
			updates.name = args.name;
		}

		if (args.description !== undefined) {
			updates.description = args.description;
		}

		if (args.sections !== undefined) {
			updates.sections = args.sections;
		}

		if (args.questions !== undefined) {
			updates.questions = args.questions;
		}

		await ctx.db.patch(args.id, updates);

		const updatedTemplate = await ctx.db.get(args.id);
		if (!updatedTemplate) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Template not found after update.",
				}),
			);
		}

		return updatedTemplate;
	},
});

/**
 * Soft delete a template.
 * Only staff members can delete templates.
 * @param id - The template ID.
 * @returns The ID of the deleted template.
 */
export const deleteTemplate = mutation({
	args: {
		id: v.id("templates"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.UNAUTHORIZED,
					message: "You must be authenticated to delete a template.",
				}),
			);
		}

		const user = await ctx.db.get(userId);
		if (!user || !user.isStaff) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.FORBIDDEN,
					message: "Only staff members can delete templates.",
				}),
			);
		}

		const template = await ctx.db.get(args.id);
		if (!template || template.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Template not found.",
				}),
			);
		}

		await ctx.db.patch(args.id, {
			deletedAt: Date.now(),
		});

		return args.id;
	},
});

/**
 * Update template's external ID (Monday.com item ID).
 * Internal mutation used by sync action.
 */
export const updateTemplateExternalId = internalMutation({
	args: {
		id: v.id("templates"),
		externalId: v.string(),
	},
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.id);
		if (!template) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Template not found.",
				}),
			);
		}

		await ctx.db.patch(args.id, {
			externalId: args.externalId,
		});

		return args.id;
	},
});

