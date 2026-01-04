import { internal } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import type { MondayHandler, MondayHandlerResult } from "@convex/src/webhooks/monday/types";
import { ensureTask, isValidTaskBoard, normalizeTask, type NormalizedTask } from "@convex/src/webhooks/monday/tasks/helpers";
import { handleCreateUpdate } from "@convex/src/webhooks/monday/updates/handlers";

/**
 * Sync a task to Convex.
 */
const syncTask = async (ctx: ActionCtx, task: NormalizedTask): Promise<MondayHandlerResult> => {
	console.log("[Task] Syncing task:", {
		externalId: task.externalId,
		name: task.name,
		workItemExternalId: task.workItemExternalId,
		status: task.status,
		teamAssigneeExternalId: task.teamAssigneeExternalId ?? "NOT SET",
	});

	if (!task.externalId || !task.workItemExternalId) {
		console.log("[Task] Missing required fields:", {
			hasExternalId: !!task.externalId,
			hasWorkItemExternalId: !!task.workItemExternalId,
		});
		return {
			status: 400,
			json: {
				success: false,
				error: "Task external ID and work item external ID are required.",
			},
		};
	}

	try {
		const result = await ctx.runMutation(internal.src.tasks.mutations.upsertTaskFromMonday, {
			workItemExternalId: task.workItemExternalId,
			externalId: task.externalId,
			name: task.name,
			status: task.status,
			type: task.type,
			description: task.description,
			dueAt: task.dueAt,
			teamAssigneeExternalId: task.teamAssigneeExternalId,
			templateExternalId: task.templateExternalId,
		});

		console.log("[Task] Upsert result:", result);

		if (!result.success) {
			return { status: 400, json: { success: false, error: result.error } };
		}

		return { status: 200, json: { success: true } };
	} catch (error: any) {
		console.error("[Task] Error syncing:", error);
		return { status: 500, json: { success: false, error: error?.message ?? "Internal server error." } };
	}
};

/**
 * Handle Monday.com column updates for sub-items (tasks).
 * Only processes events from valid work item boards.
 */
export const handleUpdateColumnValue: MondayHandler = async (ctx, payload) => {
	const enriched = await ensureTask(payload);

	if (!enriched) {
		// Might be a deleted sub-item or invalid payload.
		return { status: 200, json: { success: true } };
	}

	// Ignore events from non-work-item boards.
	if (!isValidTaskBoard(enriched.boardId)) {
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeTask({
		subitem: enriched.subitem,
		columnValues: enriched.columnValues,
		webhookColumnId: payload.event?.columnId ?? payload.body?.columnId,
		webhookColumnValue: payload.event?.value ?? payload.body?.value,
	});

	return syncTask(ctx, normalized);
};

/**
 * Handle Monday.com sub-item creation (create_subitem_pulse) for tasks.
 * Only processes sub-items created on valid work item boards.
 */
export const handleCreateSubitemPulse: MondayHandler = async (ctx, payload) => {
	const enriched = await ensureTask(payload);

	if (!enriched) {
		return { status: 400, json: { success: false, error: "Unable to fetch Monday sub-item for create." } };
	}

	// Ignore events from non-work-item boards.
	if (!isValidTaskBoard(enriched.boardId)) {
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeTask({
		subitem: enriched.subitem,
		columnValues: enriched.columnValues,
	});

	return syncTask(ctx, normalized);
};

/**
 * Handle Monday.com sub-item name changes.
 * Reuses the same logic as column updates since we fetch fresh data.
 */
export const handleChangeSubitemName: MondayHandler = async (ctx, payload) => {
	console.log("[Task] Received name change event:", {
		eventType: payload.event?.type ?? payload.body?.type,
		pulseId: payload.event?.pulseId ?? payload.body?.pulseId,
	});

	const enriched = await ensureTask(payload);

	if (!enriched) {
		return { status: 200, json: { success: true } };
	}

	if (!isValidTaskBoard(enriched.boardId)) {
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeTask({
		subitem: enriched.subitem,
		columnValues: enriched.columnValues,
	});

	return syncTask(ctx, normalized);
};

/**
 * All task event handlers mapped by Monday.com event type.
 */
export const taskHandlers: Record<string, MondayHandler> = {
	update_column_value: handleUpdateColumnValue,
	create_subitem_pulse: handleCreateSubitemPulse,
	update_name: handleChangeSubitemName,
	create_update: handleCreateUpdate,
};
