import { internal } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import { updateSubItemColumnValue } from "@convex/src/webhooks/monday/client";
import { TASK_COLUMNS } from "@convex/src/webhooks/monday/helpers";
import type { MondayHandler, MondayHandlerResult } from "@convex/src/webhooks/monday/types";
import { ensureUpdate } from "@convex/src/webhooks/monday/updates/helpers";
import { isValidTaskBoard } from "@convex/src/webhooks/monday/tasks/helpers";

/**
 * Handle Monday.com update creation events.
 * Processes updates on sub-items (tasks) and creates chat messages if the task is a Chat type.
 */
export const handleCreateUpdate: MondayHandler = async (ctx, payload) => {
	console.log("[Update] Received create_update event:", JSON.stringify(payload, null, 2));

	const enriched = await ensureUpdate(payload);

	if (!enriched) {
		return { status: 200, json: { success: true } };
	}

	// Only process updates from valid task boards.
	if (!isValidTaskBoard(enriched.subitem.parent_item.board.id)) {
		return { status: 200, json: { success: true } };
	}

	// Look up the task by external ID (sub-item ID).
	const task = await ctx.runQuery(internal.src.tasks.queries.getTaskByExternalIdInternal, {
		externalId: enriched.subitem.id,
	});

	if (!task) {
		console.log("[Update] Task not found for sub-item:", enriched.subitem.id);
		return { status: 200, json: { success: true } };
	}

	// Only process updates for Chat type tasks.
	if (task.type !== "chat") {
		return { status: 200, json: { success: true } };
	}

	// Create the chat message in Convex.
	const result = await ctx.runMutation(internal.src.chatMessages.mutations.createMessageFromMonday, {
		taskId: task._id,
		content: enriched.body,
		senderName: enriched.senderName,
		senderType: enriched.senderType,
		externalId: enriched.updateId,
	});

	if (!result) {
		console.log("[Update] Duplicate message skipped:", enriched.updateId);
	}

	// Update status based on sender type.
	if (enriched.senderType === "contact") {
		// Contact responded - set to "Client Responded".
		const updated = await updateSubItemColumnValue(
			enriched.itemId,
			enriched.boardId,
			TASK_COLUMNS.status,
			JSON.stringify({ label: "Client Responded" }),
		);
		if (!updated) {
			console.warn("[Update] Failed to update status to Client Responded for item:", enriched.itemId);
		}
	} else if (enriched.senderType === "employee") {
		// Employee sent message - set back to "Open".
		const updated = await updateSubItemColumnValue(
			enriched.itemId,
			enriched.boardId,
			TASK_COLUMNS.status,
			JSON.stringify({ label: "Open" }),
		);
		if (!updated) {
			console.warn("[Update] Failed to update status to Open for item:", enriched.itemId);
		}
	}

	return { status: 200, json: { success: true } };
};


/**
 * Handler registry for update-related Monday.com events.
 */
export const updateHandlers: Record<string, MondayHandler> = {
	create_update: handleCreateUpdate,
};
