import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { internalAction } from "@convex/_generated/server";
import { components, internal } from "@convex/_generated/api";
import { v } from "convex/values";
import { z } from "zod";

/**
 * Document intake analyst agent.
 * Analyzes uploaded documents and provides staff-only summaries.
 */
const intakeAnalyst = new Agent(components.agent, {
	name: "Intake Analyst",
	languageModel: openai("gpt-4o-mini"),
	instructions: `You are an internal intake analyst for an accounting firm. Your job is to review documents uploaded by clients and provide a brief, actionable summary for staff.

You will receive:
- The work item type (e.g., "2024 Tax Return", "Monthly Bookkeeping")
- The task name and description
- A list of uploaded document names and types

Guidelines for completeness:
- "complete": All expected documents for this task type appear to be present.
- "incomplete": Clearly missing required documents for this task type.
- "unclear": Cannot determine completeness (unusual task type, ambiguous documents, etc.)

For missingItems:
- List specific documents that are typically required but not uploaded.
- Be practical - for a W-2 upload task, if no W-2 is present, that's missing.

For suspiciousItems:
- Flag documents that seem unrelated to the task.
- Flag documents with unusual names that might indicate wrong files.
- Flag potential duplicates.

Keep the summary concise and professional. Do not make compliance claims or final decisions.`,
});

/**
 * Schema for the AI analysis output.
 */
const analysisSchema = z.object({
	summary: z.string().describe("A 1-3 sentence plain-English summary of what was uploaded and its relevance to the task."),
	completeness: z.enum(["complete", "incomplete", "unclear"]).describe("Assessment of document completeness."),
	missingItems: z.array(z.string()).describe("List of items that appear to be missing."),
	suspiciousItems: z.array(z.string()).describe("List of items that seem suspicious or need review."),
});


/**
 * Build the prompt with task and document context.
 * @param workItemTypeName - The name of the work item type.
 * @param taskName - The task name.
 * @param taskDescription - The task description (optional).
 * @param documents - Array of document metadata.
 * @returns The formatted prompt.
 */
function buildPrompt(
	workItemTypeName: string,
	taskName: string,
	taskDescription: string | undefined,
	documents: Array<{ name: string; mimeType?: string; size?: number }>,
): string {
	const docList = documents
		.map((doc, i) => {
			const sizeStr = doc.size ? ` (${Math.round(doc.size / 1024)}KB)` : "";
			const typeStr = doc.mimeType ? ` [${doc.mimeType}]` : "";
			return `${i + 1}. ${doc.name}${typeStr}${sizeStr}`;
		})
		.join("\n");

	return `Work Item Type: ${workItemTypeName}
Task: ${taskName}
${taskDescription ? `Description: ${taskDescription}` : ""}

Uploaded Documents:
${docList || "(No documents uploaded)"}

Analyze these documents and provide your assessment.`;
}


/**
 * Analyze documents uploaded to a task and generate an AI summary.
 * Triggered when a document is uploaded to a task.
 * @param taskId - The task ID to analyze.
 * @returns Success status and any error message.
 */
export const analyzeTaskDocuments = internalAction({
	args: {
		taskId: v.id("tasks"),
	},
	handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
		// Fetch task with work item context.
		const taskContext = await ctx.runQuery(internal.src.aiWorkflows.queries.getTaskAnalysisContext, {
			taskId: args.taskId,
		});

		if (!taskContext) {
			return { success: false, error: "Task not found or has no work item context." };
		}

		// Skip if no documents to analyze.
		if (taskContext.documents.length === 0) {
			// Clear any existing analysis since there are no documents.
			await ctx.runMutation(internal.src.aiWorkflows.mutations.updateTaskAiAnalysis, {
				taskId: args.taskId,
				aiAnalysis: undefined,
			});
			return { success: true };
		}

		// Build the prompt.
		const prompt = buildPrompt(
			taskContext.workItemTypeName,
			taskContext.taskName,
			taskContext.taskDescription,
			taskContext.documents,
		);

		try {
			// Use the agent to generate a structured analysis.
			const { thread } = await intakeAnalyst.createThread(ctx, {});
			const result = await thread.generateObject({
				prompt,
				schema: analysisSchema,
			});

			// Save the analysis to the task.
			await ctx.runMutation(internal.src.aiWorkflows.mutations.updateTaskAiAnalysis, {
				taskId: args.taskId,
				aiAnalysis: {
					summary: result.object.summary,
					completeness: result.object.completeness,
					missingItems: result.object.missingItems,
					suspiciousItems: result.object.suspiciousItems,
					analyzedAt: Date.now(),
					analyzedDocumentIds: taskContext.documents.map((d) => d.id),
				},
			});

			console.log(`[AI Analysis] Completed for task ${args.taskId}: ${result.object.completeness}`);
			return { success: true };
		} catch (error) {
			console.error("[AI Analysis] Failed:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "AI analysis failed.",
			};
		}
	},
});
