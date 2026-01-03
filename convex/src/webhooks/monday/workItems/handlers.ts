import { internal } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import { WORK_ITEM_BOARDS } from "@convex/src/webhooks/monday/helpers";
import { ensureWorkItem, NormalizedWorkItem, normalizeWorkItem } from "@convex/src/webhooks/monday/workItems/helpers";
import type { MondayHandler, MondayHandlerResult } from "@convex/src/webhooks/monday/types";

/**
 * Valid board IDs for work items.
 */
const VALID_BOARD_IDS = Object.keys(WORK_ITEM_BOARDS);

/**
 * Check if the event is from a valid work item board.
 */
const isValidWorkItemBoard = (boardId: string | undefined): boolean => {
	return !!boardId && VALID_BOARD_IDS.includes(boardId);
};

/**
 * Sync a work item and its tasks to Convex.
 */
const syncWorkItem = async (ctx: ActionCtx, workItem: NormalizedWorkItem): Promise<MondayHandlerResult> => {
	console.log("[WorkItem] Syncing work item:", {
		externalId: workItem.externalId,
		name: workItem.name,
		clientExternalId: workItem.clientExternalId,
		typeName: workItem.typeName,
		status: workItem.status,
		taskCount: workItem.tasks.length,
	});

	if (!workItem.externalId || !workItem.clientExternalId || !workItem.typeName) {
		console.log("[WorkItem] Missing required fields:", {
			hasExternalId: !!workItem.externalId,
			hasClientExternalId: !!workItem.clientExternalId,
			hasTypeName: !!workItem.typeName,
		});
		return {
			status: 400,
			json: {
				success: false,
				error: "Work item external ID, client external ID, and type name are required.",
			},
		};
	}

	try {
		// Sync the work item.
		const result = await ctx.runMutation(internal.src.workItems.mutations.upsertWorkItemFromMonday, {
			accountExternalId: workItem.clientExternalId,
			typeName: workItem.typeName,
			externalId: workItem.externalId,
			status: workItem.status ?? "Not Started",
			name: workItem.name,
			dueAt: workItem.dueAt,
		});

		console.log("[WorkItem] Upsert result:", result);

		if (!result.success) {
			return { status: 400, json: { success: false, error: result.error } };
		}

		// Sync tasks (sub-items).
		console.log("[WorkItem] Syncing", workItem.tasks.length, "tasks...");
		for (const task of workItem.tasks) {
			console.log("[Task] Syncing task:", {
				externalId: task.externalId,
				name: task.name,
				status: task.status,
				description: task.description,
				dueAt: task.dueAt,
			});
			await ctx.runMutation(internal.src.tasks.mutations.upsertTaskFromMonday, {
				workItemExternalId: workItem.externalId,
				externalId: task.externalId,
				name: task.name,
				status: task.status,
				description: task.description,
				dueAt: task.dueAt,
			});
		}

		console.log("[WorkItem] Sync complete.");
		return { status: 200, json: { success: true } };
	} catch (error: any) {
		console.error("[WorkItem] Error syncing:", error);
		return { status: 500, json: { success: false, error: error?.message ?? "Internal server error." } };
	}
};

/**
 * Handle Monday.com column updates by updating a work item.
 * Only processes events from valid work item boards.
 */
export const handleUpdateColumnValue: MondayHandler = async (ctx, { body, event }) => {
	const boardId = String(event?.boardId ?? body?.boardId);

	// Ignore events from other boards.
	if (!isValidWorkItemBoard(boardId)) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureWorkItem({ body, event });
	const normalized = normalizeWorkItem({
		body,
		event: enriched?.event ?? event,
		columnValues: enriched?.columnValues,
		boardId: enriched?.boardId ?? boardId,
		subitems: enriched?.subitems,
	});

	return syncWorkItem(ctx, normalized);
};

/**
 * Handle Monday.com item creation (create_pulse) for work items.
 * Only processes items created on valid work item boards.
 */
export const handleCreatePulse: MondayHandler = async (ctx, payload) => {
	const boardId = String(payload.event?.boardId ?? payload.body?.boardId);

	// Ignore events from other boards.
	if (!isValidWorkItemBoard(boardId)) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureWorkItem(payload);
	if (!enriched) {
		return { status: 400, json: { success: false, error: "Unable to fetch Monday item for create." } };
	}

	const normalized = normalizeWorkItem({
		body: payload.body,
		event: enriched.event,
		columnValues: enriched.columnValues,
		boardId: enriched.boardId ?? boardId,
		subitems: enriched.subitems,
	});

	return syncWorkItem(ctx, normalized);
};

/**
 * Handle Monday.com work item name changes.
 * Reuses the same logic as column updates since we fetch fresh data.
 */
export const handleUpdateName: MondayHandler = async (ctx, payload) => {
	const boardId = String(payload.event?.boardId ?? payload.body?.boardId);

	if (!isValidWorkItemBoard(boardId)) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureWorkItem(payload);
	if (!enriched) {
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeWorkItem({
		body: payload.body,
		event: enriched.event,
		columnValues: enriched.columnValues,
		boardId: enriched.boardId ?? boardId,
		subitems: enriched.subitems,
	});

	return syncWorkItem(ctx, normalized);
};

/**
 * All work item event handlers mapped by Monday.com event type.
 */
export const workItemHandlers: Record<string, MondayHandler> = {
	update_column_value: handleUpdateColumnValue,
	create_pulse: handleCreatePulse,
	update_name: handleUpdateName,
};
