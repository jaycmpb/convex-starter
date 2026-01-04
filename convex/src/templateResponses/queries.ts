import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "@convex/_generated/server";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Get or create a template response for a task.
 * Returns the response if it exists, otherwise returns null (frontend will create on first answer).
 * @param taskId - The task ID.
 * @returns The response document or null.
 */
export const getResponseForTask = query({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt || !task.templateId) {
			return null;
		}

		const response = await ctx.db
			.query("templateResponses")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.first();

		return response ?? null;
	},
});

/**
 * Get response progress for a task.
 * Returns the current question index and completion status.
 * @param taskId - The task ID.
 * @returns Progress information or null if no response exists.
 */
export const getResponseProgress = query({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt || !task.templateId) {
			return null;
		}

		const response = await ctx.db
			.query("templateResponses")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.first();

		if (!response) {
			return null;
		}

		// Use template snapshot if available, otherwise fetch live template.
		let totalQuestions: number;
		if (response.templateSnapshot) {
			totalQuestions = response.templateSnapshot.questions.length;
		} else {
			const template = await ctx.db.get(response.templateId);
			if (!template || template.deletedAt) {
				return null;
			}
			totalQuestions = template.questions.length;
		}

		return {
			currentQuestionIndex: response.currentQuestionIndex,
			totalQuestions,
			answeredQuestions: response.answers.length,
			status: response.status,
			taskStatus: task.status,
			lastSavedAt: response.lastSavedAt,
			completedAt: response.completedAt,
		};
	},
});

