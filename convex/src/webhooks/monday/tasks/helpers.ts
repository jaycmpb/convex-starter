import { fetchSubItem, type MondaySubItemWithParent } from "@convex/src/webhooks/monday/client";
import { extractValue, type MondayColumnValue, parseColumnValues, TASK_COLUMNS, WORK_ITEM_BOARDS } from "@convex/src/webhooks/monday/helpers";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

export type NormalizedTask = {
	name: string;
	externalId: string;
	workItemExternalId: string;
	status?: string;
	type?: "document" | "questionnaire" | "question" | "chat";
	description?: string;
	dueAt?: number;
	teamAssigneeExternalId?: string;
};

/**
 * Valid board IDs for work items (tasks must belong to work item boards).
 */
const VALID_BOARD_IDS = Object.keys(WORK_ITEM_BOARDS);

/**
 * Check if the event is from a valid work item board (sub-items inherit parent board).
 */
export const isValidTaskBoard = (boardId: string | undefined): boolean => {
	return !!boardId && VALID_BOARD_IDS.includes(boardId);
};

/**
 * Extract the first linked item ID from a board_relation column value.
 * Supports both single column ID and array of column IDs (for columns that vary by board).
 */
const extractLinkedId = (values: MondayColumnValue[], columnId: string | string[]): string | undefined => {
	const columnIds = Array.isArray(columnId) ? columnId : [columnId];

	for (const id of columnIds) {
		const entry = values.find((v) => v.id === id);
		if (!entry) continue;

		// First try linked_items array (from GraphQL query).
		if (entry.linked_items && Array.isArray(entry.linked_items) && entry.linked_items.length > 0) {
			return String(entry.linked_items[0].id);
		}

		// Fallback to parsing value JSON (from webhook payload).
		if (entry.value) {
			try {
				const parsed = JSON.parse(entry.value);
				if (parsed?.linkedPulseIds && Array.isArray(parsed.linkedPulseIds) && parsed.linkedPulseIds.length > 0) {
					return String(parsed.linkedPulseIds[0].linkedPulseId);
				}
			} catch {
				// Fall through.
			}
		}
	}

	return undefined;
};


/**
 * Extract the first linked item ID from a Monday.com webhook value payload.
 * Used for update_column_value events where we have the exact webhook value.
 */
const extractLinkedIdFromWebhookValue = (value: unknown): string | undefined => {
	if (!value || typeof value !== "object") return undefined;
	const parsed = value as { linkedPulseIds?: { linkedPulseId: number }[] };
	if (parsed.linkedPulseIds?.length) {
		return String(parsed.linkedPulseIds[0].linkedPulseId);
	}
	return undefined;
};


/**
 * Parse a Monday.com date column value to a Unix timestamp.
 */
const parseDateToTimestamp = (values: MondayColumnValue[], columnId: string): number | undefined => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return undefined;

	if (entry.text) {
		const date = new Date(entry.text);
		if (!isNaN(date.getTime())) {
			return date.getTime();
		}
	}

	if (entry.value) {
		try {
			const parsed = JSON.parse(entry.value);
			if (parsed?.date) {
				const date = new Date(parsed.date);
				if (!isNaN(date.getTime())) {
					return date.getTime();
				}
			}
		} catch {
			// Fall through.
		}
	}

	return undefined;
};

/**
 * Parse a Monday.com dropdown column value to normalized type.
 */
const parseType = (values: MondayColumnValue[], columnId: string): "document" | "questionnaire" | "question" | "chat" | undefined => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return undefined;

	const typeValue = entry.text?.toLowerCase() ?? entry.value?.toLowerCase();
	if (typeValue === "document") return "document";
	if (typeValue === "questionnaire") return "questionnaire";
	if (typeValue === "question") return "question";
	if (typeValue === "chat") return "chat";
	return undefined;
};

/**
 * Normalize task data from a Monday.com sub-item.
 */
export const normalizeTask = (input: {
	subitem: MondaySubItemWithParent;
	columnValues?: MondayColumnValue[];
	webhookColumnId?: string;
	webhookColumnValue?: unknown;
}): NormalizedTask => {
	const columnValues: MondayColumnValue[] = input.columnValues ?? input.subitem.column_values ?? [];

	const name = input.subitem.name;
	const externalId = input.subitem.id;
	const workItemExternalId = input.subitem.parent_item.id;
	const status = extractValue(columnValues, TASK_COLUMNS.status);
	const type = parseType(columnValues, TASK_COLUMNS.type);
	const description = extractValue(columnValues, TASK_COLUMNS.details);
	const dueAt = parseDateToTimestamp(columnValues, TASK_COLUMNS.dueDate);

	// For team assignee, prefer webhook value if the changed column matches.
	let teamAssigneeExternalId: string | undefined;
	if (input.webhookColumnId && TASK_COLUMNS.teamAssignee.includes(input.webhookColumnId)) {
		// Use webhook value directly.
		teamAssigneeExternalId = extractLinkedIdFromWebhookValue(input.webhookColumnValue);
	} else {
		// Fall back to fetched column values.
		teamAssigneeExternalId = extractLinkedId(columnValues, TASK_COLUMNS.teamAssignee);
	}

	return { name, externalId, workItemExternalId, status, type, description, dueAt, teamAssigneeExternalId };
};

/**
 * Fetch and enrich a Monday.com sub-item (task) by pulse ID.
 */
export const ensureTask = async (
	payload: MondayWebhookPayload,
): Promise<{
	subitem: MondaySubItemWithParent;
	columnValues: MondayColumnValue[];
	boardId: string;
} | null> => {
	const pulseId = payload.event?.pulseId ?? payload.body?.pulseId;
	console.log("[ensureTask] Fetching sub-item with pulseId:", pulseId);

	if (!pulseId) {
		console.log("[ensureTask] No pulseId found in payload.");
		return null;
	}

	const subitem = await fetchSubItem(Number(pulseId));
	console.log("[ensureTask] Fetched sub-item:", {
		id: subitem?.id,
		name: subitem?.name,
		parentItemId: subitem?.parent_item?.id,
		parentBoardId: subitem?.parent_item?.board?.id,
	});

	if (!subitem || !subitem.parent_item) {
		console.log("[ensureTask] Sub-item not found or missing parent.");
		return null;
	}

	return {
		subitem,
		columnValues: subitem.column_values,
		boardId: subitem.parent_item.board.id,
	};
};
