"use node";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { action, internalAction } from "@convex/_generated/server";
import { api, internal } from "@convex/_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { MissingFilesRequestEmail } from "@emails/task/missing-files-request";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { extractText } from "unpdf";
import { v } from "convex/values";
import { z } from "zod";

/**
 * System prompt for document intake analysis.
 */
const INTAKE_ANALYST_SYSTEM_PROMPT = `You are an internal intake analyst for an accounting firm. Your job is to review documents uploaded by clients and provide a brief, actionable summary for staff.

You will receive:
- The work item type (e.g., "2024 Tax Return", "Monthly Bookkeeping")
- The task name and description
- Document content: either images (for visual analysis) or extracted text (from PDFs)

IMPORTANT: Analyze the actual document contents provided, not just file names.

Guidelines for completeness:
- "complete": The uploaded documents contain the expected information for this task type.
- "incomplete": The documents are missing required information or the wrong documents were uploaded.
- "unclear": Cannot determine completeness (unusual task type, documents are unreadable, etc.)

For missingItems:
- List specific documents or information that are typically required but not present.
- Be practical - for a W-2 upload task, if you don't see W-2 content, that's missing.

For suspiciousItems:
- Flag documents that seem unrelated to the task based on their actual content.
- Flag documents that appear to be the wrong form or document type.
- Flag potential issues like expired documents, wrong tax year, etc.

For recommendedActions:
- If completeness is "incomplete" and there are missingItems, recommend "request_missing_files" action with label "Request Missing Files".
- If completeness is "complete", recommend "mark_complete" action with label "Mark Task Complete".
- Do not recommend actions for "unclear" completeness.

Keep the summary concise and professional. Do not make compliance claims or final decisions.`;

/**
 * MIME types that GPT-4o vision can analyze directly as images.
 */
const VISION_SUPPORTED_MIME_TYPES = [
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/gif",
	"image/webp",
];

/**
 * MIME types that we can extract text from.
 */
const PDF_MIME_TYPES = ["application/pdf"];

/**
 * Extract text content from a PDF file.
 * @param url - The URL of the PDF file.
 * @returns The extracted text or null if extraction fails.
 */
async function extractPdfText(url: string): Promise<string | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.warn(`[PDF Extract] Failed to fetch PDF: ${response.status}`);
			return null;
		}
		const arrayBuffer = await response.arrayBuffer();

		// Use unpdf which handles serverless environments properly.
		const { text } = await extractText(new Uint8Array(arrayBuffer));

		return text.join("\n\n");
	} catch (error) {
		console.warn("[PDF Extract] Failed to extract text:", error);
		return null;
	}
}

/**
 * Schema for the AI analysis output.
 */
const analysisSchema = z.object({
	summary: z.string().describe("A 1-3 sentence plain-English summary of what was uploaded and its relevance to the task."),
	completeness: z.enum(["complete", "incomplete", "unclear"]).describe("Assessment of document completeness."),
	missingItems: z.array(z.string()).describe("List of items that appear to be missing."),
	suspiciousItems: z.array(z.string()).describe("List of items that seem suspicious or need review."),
	recommendedActions: z
		.array(
			z.object({
				type: z.enum(["request_missing_files", "mark_complete"]).describe("The type of recommended action."),
				label: z.string().describe("Human-readable label for the action button."),
				data: z
					.optional(
						z.object({
							missingItems: z.optional(z.array(z.string())).describe("Missing items to include in the request (only for request_missing_files)."),
						}),
					)
					.describe("Optional data for the action."),
			}),
		)
		.describe("Recommended next actions for staff to take."),
});


/**
 * Build the text prompt with task context.
 * @param workItemTypeName - The name of the work item type.
 * @param taskName - The task name.
 * @param taskDescription - The task description (optional).
 * @param imageCount - Number of images being analyzed visually.
 * @param pdfCount - Number of PDFs with extracted text.
 * @returns The formatted prompt.
 */
function buildTextPrompt(
	workItemTypeName: string,
	taskName: string,
	taskDescription: string | undefined,
	imageCount: number,
	pdfCount: number,
): string {
	const parts = [];
	if (imageCount > 0) {
		parts.push(`${imageCount} image(s) for visual analysis`);
	}
	if (pdfCount > 0) {
		parts.push(`${pdfCount} PDF(s) with extracted text`);
	}

	return `Work Item Type: ${workItemTypeName}
Task: ${taskName}
${taskDescription ? `Description: ${taskDescription}` : ""}

I am providing ${parts.join(" and ")}. Please analyze the content and provide your assessment.`;
}


/**
 * Analyze documents uploaded to a task and generate an AI summary.
 * Uses GPT-4o vision to analyze actual document contents.
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

		// Categorize documents by type.
		const imageDocs = taskContext.documents.filter(
			(doc) => doc.url && doc.mimeType && VISION_SUPPORTED_MIME_TYPES.includes(doc.mimeType),
		);
		const pdfDocs = taskContext.documents.filter(
			(doc) => doc.url && doc.mimeType && PDF_MIME_TYPES.includes(doc.mimeType),
		);
		const otherDocs = taskContext.documents.filter(
			(doc) =>
				!doc.mimeType ||
				(!VISION_SUPPORTED_MIME_TYPES.includes(doc.mimeType) && !PDF_MIME_TYPES.includes(doc.mimeType)),
		);

		// Extract text from PDFs.
		const pdfTexts: Array<{ name: string; text: string }> = [];
		for (const doc of pdfDocs) {
			if (doc.url) {
				const text = await extractPdfText(doc.url);
				if (text && text.trim().length > 0) {
					pdfTexts.push({ name: doc.name, text: text.trim() });
				}
			}
		}

		// Build message content.
		const messageContent: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [];

		// Add the text prompt.
		const textPrompt = buildTextPrompt(
			taskContext.workItemTypeName,
			taskContext.taskName,
			taskContext.taskDescription,
			imageDocs.length,
			pdfTexts.length,
		);
		messageContent.push({ type: "text", text: textPrompt });

		// Add images for vision analysis.
		for (const doc of imageDocs) {
			if (doc.url) {
				messageContent.push({
					type: "image",
					image: new URL(doc.url),
				});
				messageContent.push({
					type: "text",
					text: `(Above image: ${doc.name})`,
				});
			}
		}

		// Add extracted PDF text.
		for (const pdf of pdfTexts) {
			// Truncate very long PDFs to avoid token limits.
			const maxChars = 15000;
			const truncatedText = pdf.text.length > maxChars ? `${pdf.text.substring(0, maxChars)}...[truncated]` : pdf.text;
			messageContent.push({
				type: "text",
				text: `\n--- PDF Document: ${pdf.name} ---\n${truncatedText}\n--- End of ${pdf.name} ---\n`,
			});
		}

		// Handle PDFs that couldn't be extracted.
		const failedPdfs = pdfDocs.filter((doc) => !pdfTexts.some((p) => p.name === doc.name));
		if (failedPdfs.length > 0) {
			const failedList = failedPdfs.map((doc) => doc.name).join(", ");
			messageContent.push({
				type: "text",
				text: `\nNote: Could not extract text from these PDFs (may be scanned/image-based): ${failedList}`,
			});
		}

		// Include other unsupported documents as file names only.
		if (otherDocs.length > 0) {
			const docList = otherDocs.map((doc) => `${doc.name} [${doc.mimeType || "unknown type"}]`).join(", ");
			messageContent.push({
				type: "text",
				text: `\nNote: These files could not be analyzed (unsupported format): ${docList}`,
			});
		}

		// If nothing could be analyzed, fall back to file names.
		if (imageDocs.length === 0 && pdfTexts.length === 0) {
			const docList = taskContext.documents
				.map((doc, i) => `${i + 1}. ${doc.name} [${doc.mimeType || "unknown type"}]`)
				.join("\n");
			messageContent.push({
				type: "text",
				text: `\n\nNote: No documents could be analyzed. Here are the file names:\n${docList}\n\nPlease analyze based on file names only.`,
			});
		}

		try {
			// Use GPT-4o with vision to analyze the documents.
			const result = await generateObject({
				model: openai("gpt-4o"),
				system: INTAKE_ANALYST_SYSTEM_PROMPT,
				messages: [
					{
						role: "user",
						content: messageContent,
					},
				],
				schema: analysisSchema,
			});

			// Generate recommended actions based on completeness.
			const recommendedActions: Array<{
				type: "request_missing_files" | "mark_complete";
				label: string;
				data?: { missingItems?: string[] };
			}> = [];

			if (result.object.completeness === "incomplete" && result.object.missingItems.length > 0) {
				recommendedActions.push({
					type: "request_missing_files",
					label: "Request Missing Files",
					data: {
						missingItems: result.object.missingItems,
					},
				});
			} else if (result.object.completeness === "complete") {
				recommendedActions.push({
					type: "mark_complete",
					label: "Mark Task Complete",
				});
			}

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
					recommendedActions,
				},
			});

			console.log(`[AI Analysis] Completed for task ${args.taskId}: ${result.object.completeness} (${imageDocs.length} images, ${pdfTexts.length} PDFs)`);
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

/**
 * Execute a recommended action from AI analysis.
 * @param taskId - The task ID.
 * @param actionType - The type of action to execute.
 * @param actionData - Optional data for the action.
 * @returns Success status and any error message.
 */
export const executeRecommendedAction = action({
	args: {
		taskId: v.id("tasks"),
		actionType: v.union(v.literal("request_missing_files"), v.literal("mark_complete")),
		actionData: v.optional(
			v.object({
				missingItems: v.optional(v.array(v.string())),
			}),
		),
	},
	handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
		// Get the authenticated user.
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return { success: false, error: "You must be authenticated to execute actions." };
		}

		// Get the task and verify it exists.
		const task = await ctx.runQuery(internal.src.tasks.queries.getTaskByIdInternal, {
			id: args.taskId,
		});

		if (!task) {
			return { success: false, error: "Task not found." };
		}

		// Get the user and verify they are staff.
		const user = await ctx.runQuery(internal.src.users.queries.getUserByIdInternal, {
			id: userId,
		});

		if (!user || !user.isStaff) {
			return { success: false, error: "Only staff members can execute recommended actions." };
		}

		// Get the work item.
		const workItem = await ctx.runQuery(internal.src.workItems.queries.getWorkItemByIdInternal, {
			id: task.workItemId,
		});

		if (!workItem) {
			return { success: false, error: "Work item not found." };
		}

		// Get sender name.
		const senderName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email ?? "Staff";

		// Execute the action based on type.
		if (args.actionType === "request_missing_files") {
			const missingItems = args.actionData?.missingItems ?? [];

			// If task is a chat task, send a chat message.
			if (task.type === "chat") {
				let messageContent = "We need the following documents to complete this task:\n\n";
				missingItems.forEach((item, index) => {
					messageContent += `${index + 1}. ${item}\n`;
				});
				messageContent += "\nPlease upload these documents when you have them available.";

				await ctx.runMutation(internal.src.chatMessages.mutations.sendMessageAsEmployee, {
					taskId: args.taskId,
					content: messageContent,
					senderName,
					senderId: userId,
				});
			} else {
				// For all other task types, send an email to all users with access to the account.
				await ctx.runMutation(internal.src.aiWorkflows.mutations.sendMissingFilesEmail, {
					taskId: args.taskId,
					workItemId: task.workItemId,
					accountId: workItem.accountId,
					taskName: task.name,
					workItemName: workItem.name,
					missingItems,
					senderName,
				});
			}

			// Set task status back to "Open" after requesting missing files (syncs to Monday.com).
			await ctx.runAction(api.src.tasks.actions.updateTaskStatusWithMondaySync, {
				taskId: args.taskId,
				status: "Open",
			});

			return { success: true };
		} else if (args.actionType === "mark_complete") {
			// Update task status to "Complete" (syncs to Monday.com).
			await ctx.runAction(api.src.tasks.actions.updateTaskStatusWithMondaySync, {
				taskId: args.taskId,
				status: "Complete",
			});

			return { success: true };
		}

		return { success: false, error: "Unknown action type." };
	},
});


/**
 * Send a missing files request email to a user.
 * @param userId - The user ID (for logging).
 * @param email - The user's email address.
 * @param firstName - Optional first name for personalization.
 * @param taskId - The task ID.
 * @param taskName - The task name.
 * @param workItemName - The work item name (optional).
 * @param missingItems - List of missing items.
 * @param senderName - The name of the staff member sending the request.
 */
export const sendMissingFilesRequestEmail = internalAction({
	args: {
		userId: v.id("users"),
		email: v.string(),
		firstName: v.optional(v.string()),
		taskId: v.id("tasks"),
		taskName: v.string(),
		workItemName: v.optional(v.string()),
		missingItems: v.array(v.string()),
		senderName: v.string(),
	},
	handler: async (ctx, args) => {
		const resend = new Resend(process.env.RESEND_API_KEY);

		// Generate the dashboard URL.
		const dashboardUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/dashboard/work-items` : "#";

		// Render the email template.
		const html = await render(
			MissingFilesRequestEmail({
				firstName: args.firstName || "there",
				taskName: args.taskName,
				workItemName: args.workItemName,
				dashboardUrl,
				missingItems: args.missingItems,
				senderName: args.senderName,
			}),
		);

		const { error } = await resend.emails.send({
			from: "Notifications <no-reply@notifications.ryzeware.com>",
			to: args.email,
			subject: `Documents Needed: ${args.taskName}`,
			html,
		});

		if (error) {
			console.error(`[Missing Files Request] Failed to send email to ${args.email}:`, error.message);
			throw new Error(error.message);
		}

		console.log(`[Missing Files Request] Email sent to ${args.email} for task ${args.taskId}.`);
	},
});
