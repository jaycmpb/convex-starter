import { fetchSubItem, type MondaySubItemWithParent } from "@convex/src/webhooks/monday/client";
import {
	extractValue,
	type MondayColumnValue,
	parseColumnValues,
	TASK_COLUMNS,
	WORK_ITEM_BOARDS,
} from "@convex/src/webhooks/monday/helpers";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

export type NormalizedTask = {
	name: string;
	externalId: string;
	workItemExternalId: string;
	status?: string;
	description?: string;
	dueAt?: number;
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
 * Normalize task data from a Monday.com sub-item.
 */
export const normalizeTask = (input: {
	subitem: MondaySubItemWithParent;
	columnValues?: MondayColumnValue[];
}): NormalizedTask => {
	const columnValues: MondayColumnValue[] = input.columnValues ?? input.subitem.column_values ?? [];

	const name = input.subitem.name;
	const externalId = input.subitem.id;
	const workItemExternalId = input.subitem.parent_item.id;
	const status = extractValue(columnValues, TASK_COLUMNS.status);
	const description = extractValue(columnValues, TASK_COLUMNS.details);
	const dueAt = parseDateToTimestamp(columnValues, TASK_COLUMNS.dueDate);

	return { name, externalId, workItemExternalId, status, description, dueAt };
};


/**
 * Fetch and enrich a Monday.com sub-item (task) by pulse ID.
 */
export const ensureTask = async (payload: MondayWebhookPayload): Promise<{
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

