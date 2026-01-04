import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "@convex/_generated/server";
import { api } from "@convex/_generated/api";
import { ErrorCodes } from "@convex/src/_shared/errorCodes";
import { v } from "convex/values";

/**
 * Save an answer for a question in a template response.
 * Auto-saves the answer and updates the current question index.
 * @param taskId - The task ID.
 * @param questionId - The question ID.
 * @param value - The answer value.
 * @returns The updated response document.
 */
export const saveAnswer = mutation({
	args: {
		taskId: v.id("tasks"),
		questionId: v.string(),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.UNAUTHORIZED,
					message: "You must be authenticated to save an answer.",
				}),
			);
		}

		const task = await ctx.db.get(args.taskId);
		if (!task || task.deletedAt || !task.templateId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Task not found or does not have a template assigned.",
				}),
			);
		}

		// Get or create response.
		let response = await ctx.db
			.query("templateResponses")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.first();

		if (!response) {
			// Create new response.
			const template = await ctx.db.get(task.templateId);
			if (!template || template.deletedAt) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.NOT_FOUND,
						message: "Template not found.",
					}),
				);
			}

			// Find the question index.
			const questionIndex = template.questions.findIndex((q) => q.id === args.questionId);
			if (questionIndex === -1) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.NOT_FOUND,
						message: "Question not found in template.",
					}),
				);
			}

			// Create snapshot of template at this point in time.
			const templateSnapshot = {
				name: template.name,
				description: template.description,
				sections: template.sections,
				questions: template.questions,
			};

			const responseId = await ctx.db.insert("templateResponses", {
				taskId: args.taskId,
				templateId: task.templateId,
				templateSnapshot,
				answers: [{ questionId: args.questionId, value: args.value }],
				currentQuestionIndex: questionIndex,
				status: "in_progress",
				lastSavedAt: Date.now(),
			});

			const insertedResponse = await ctx.db.get(responseId);
			if (!insertedResponse) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.NOT_FOUND,
						message: "Response not found after creation.",
					}),
				);
			}
			response = insertedResponse;
		} else {
			// Update existing response.
			const template = await ctx.db.get(response.templateId);
			if (!template || template.deletedAt) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.NOT_FOUND,
						message: "Template not found.",
					}),
				);
			}

			// Find the question index.
			const questionIndex = template.questions.findIndex((q) => q.id === args.questionId);
			if (questionIndex === -1) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.NOT_FOUND,
						message: "Question not found in template.",
					}),
				);
			}

			// Update or add answer.
			const existingAnswerIndex = response.answers.findIndex((a) => a.questionId === args.questionId);
			const updatedAnswers = [...response.answers];
			if (existingAnswerIndex >= 0) {
				updatedAnswers[existingAnswerIndex] = { questionId: args.questionId, value: args.value };
			} else {
				updatedAnswers.push({ questionId: args.questionId, value: args.value });
			}

			await ctx.db.patch(response._id, {
				answers: updatedAnswers,
				currentQuestionIndex: questionIndex,
				lastSavedAt: Date.now(),
			});

			response = await ctx.db.get(response._id);
			if (!response) {
				throw new Error(
					JSON.stringify({
						...ErrorCodes.NOT_FOUND,
						message: "Response not found after update.",
					}),
				);
			}
		}

		return response;
	},
});

/**
 * Manually save progress for a template response.
 * Updates the lastSavedAt timestamp.
 * @param taskId - The task ID.
 * @returns The updated response document.
 */
export const saveProgress = mutation({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.UNAUTHORIZED,
					message: "You must be authenticated to save progress.",
				}),
			);
		}

		const response = await ctx.db
			.query("templateResponses")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.first();

		if (!response) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Response not found. Save an answer first.",
				}),
			);
		}

		await ctx.db.patch(response._id, {
			lastSavedAt: Date.now(),
		});

		const updatedResponse = await ctx.db.get(response._id);
		if (!updatedResponse) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Response not found after update.",
				}),
			);
		}

		return updatedResponse;
	},
});

/**
 * Submit a completed template response.
 * Marks the response as completed and sets completedAt timestamp.
 * @param taskId - The task ID.
 * @returns The updated response document.
 */
export const submitResponse = mutation({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.UNAUTHORIZED,
					message: "You must be authenticated to submit a response.",
				}),
			);
		}

		const response = await ctx.db
			.query("templateResponses")
			.withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
			.first();

		if (!response) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Response not found.",
				}),
			);
		}

		// Validate that all required questions are answered.
		const template = await ctx.db.get(response.templateId);
		if (!template || template.deletedAt) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Template not found.",
				}),
			);
		}

		const answeredQuestionIds = new Set(response.answers.map((a) => a.questionId));
		const requiredQuestions = template.questions.filter((q) => q.required);
		const missingRequired = requiredQuestions.filter((q) => !answeredQuestionIds.has(q.id));

		if (missingRequired.length > 0) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.VALIDATION_ERROR,
					message: `Please answer all required questions. Missing: ${missingRequired.map((q) => q.title).join(", ")}`,
				}),
			);
		}

		await ctx.db.patch(response._id, {
			status: "completed",
			completedAt: Date.now(),
			lastSavedAt: Date.now(),
		});

		// Update task status to "Client Responded" and sync to Monday.com.
		await ctx.scheduler.runAfter(0, api.src.tasks.actions.updateTaskStatusWithMondaySync, {
			taskId: args.taskId,
			status: "Client Responded",
		});

		const updatedResponse = await ctx.db.get(response._id);
		if (!updatedResponse) {
			throw new Error(
				JSON.stringify({
					...ErrorCodes.NOT_FOUND,
					message: "Response not found after update.",
				}),
			);
		}

		return updatedResponse;
	},
});

