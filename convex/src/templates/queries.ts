import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, query } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Get a template by ID.
 * Staff can access any template, others can only access templates assigned to their tasks.
 * @param id - The template ID.
 * @returns The template document.
 */
export const getTemplate = query({
	args: {
		id: v.id("templates"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		const template = await ctx.db.get(args.id);

		if (!template || template.deletedAt) {
			return null;
		}

		// Staff can access any template.
		if (userId) {
			const user = await ctx.db.get(userId);
			if (user?.isStaff) {
				return template;
			}
		}

		// Non-staff can only access templates assigned to their tasks.
		// This will be checked at the task level in the frontend.
		return template;
	},
});

/**
 * List all templates for staff members.
 * @returns Array of template documents.
 */
export const listTemplates = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const user = await ctx.db.get(userId);
		if (!user || !user.isStaff) {
			return [];
		}

		const templates = await ctx.db
			.query("templates")
			.filter((q) => q.eq(q.field("deletedAt"), undefined))
			.collect();

		return templates;
	},
});

/**
 * Get template assigned to a task.
 * Returns the template snapshot from response if available, otherwise returns the live template.
 * This ensures that template updates don't affect in-progress questionnaires.
 * @param taskId - The task ID.
 * @returns The template document if assigned, null otherwise.
 */
export const getTemplateForTask = query({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt || !task.templateId) {
			return null;
		}

		// Check if there's a response with a template snapshot.
		const response = await ctx.db
			.query("templateResponses")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.first();

		if (response?.templateSnapshot) {
			// Return the snapshot version to preserve the template state at first interaction.
			return response.templateSnapshot as any;
		}

		// Fall back to live template if no snapshot exists.
		const template = await ctx.db.get(task.templateId);
		if (!template || template.deletedAt) {
			return null;
		}

		return template;
	},
});

/**
 * Get template for sync (internal query).
 * Used by sync action to fetch template data.
 */
export const getTemplateForSync = internalQuery({
	args: {
		templateId: v.id("templates"),
	},
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId);
		if (!template || template.deletedAt) {
			return null;
		}
		return template;
	},
});

