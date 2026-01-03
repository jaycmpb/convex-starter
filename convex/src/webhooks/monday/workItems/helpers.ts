import { fetchItemWithSubitems, type MondaySubItem } from "@convex/src/webhooks/monday/client";
import { extractValue, type MondayColumnValue, parseColumnValues, TASK_COLUMNS, WORK_ITEM_BOARDS, WORK_ITEM_COLUMNS } from "@convex/src/webhooks/monday/helpers";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

export type NormalizedTask = {
	name: string;
	externalId: string;
	status?: string;
	description?: string;
	dueAt?: number;
};

export type NormalizedWorkItem = {
	name?: string;
	externalId?: string;
	clientExternalId?: string;
	status?: string;
	dueAt?: number;
	typeName?: string;
	tasks: NormalizedTask[];
};

/**
 * Extract linked item ID from a board_relation column value.
 * Returns the first linked item ID (work items should only link to one client).
 */
const extractLinkedId = (values: MondayColumnValue[], columnId: string): string | undefined => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return undefined;

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

	return undefined;
};

/**
 * Parse a Monday.com date column value to a Unix timestamp.
 */
const parseDateToTimestamp = (values: MondayColumnValue[], columnId: string): number | undefined => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return undefined;

	// Try text value first (formatted date string).
	if (entry.text) {
		const date = new Date(entry.text);
		if (!isNaN(date.getTime())) {
			return date.getTime();
		}
	}

	// Try parsing the value JSON.
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
 * Normalize a sub-item into a task.
 */
const normalizeSubItem = (subitem: MondaySubItem): NormalizedTask => {
	const columnValues = subitem.column_values ?? [];
	const status = extractValue(columnValues, TASK_COLUMNS.status);
	const description = extractValue(columnValues, TASK_COLUMNS.details);
	const dueAt = parseDateToTimestamp(columnValues, TASK_COLUMNS.dueDate);

	return {
		name: subitem.name,
		externalId: subitem.id,
		status,
		description,
		dueAt,
	};
};

/**
 * Normalize work item data from Monday.com webhook payload and column values.
 */
export const normalizeWorkItem = (input: {
	body: Record<string, any>;
	event: Record<string, any>;
	columnValues?: MondayColumnValue[];
	boardId?: string;
	subitems?: MondaySubItem[];
}): NormalizedWorkItem => {
	const columnValues: MondayColumnValue[] = input.columnValues ?? parseColumnValues(input.event?.columnValues);

	const name = input.body.name ?? input.event?.pulseName;
	const externalId = input.body.externalId ?? (input.event?.pulseId ? String(input.event.pulseId) : undefined);
	const clientExternalId = extractLinkedId(columnValues, WORK_ITEM_COLUMNS.client);
	const status = extractValue(columnValues, WORK_ITEM_COLUMNS.status);
	const dueAt = parseDateToTimestamp(columnValues, WORK_ITEM_COLUMNS.deadline);

	// Determine work item type from board ID.
	const boardId = input.boardId ?? input.event?.boardId ?? input.body?.boardId;
	const boardConfig = boardId ? WORK_ITEM_BOARDS[String(boardId)] : undefined;
	const typeName = boardConfig?.typeName;

	// Normalize sub-items into tasks.
	const tasks = (input.subitems ?? []).map(normalizeSubItem);

	return { name, externalId, clientExternalId, status, dueAt, typeName, tasks };
};

/**
 * Fetch and enrich a Monday.com work item with sub-items by pulse ID.
 */
export const ensureWorkItem = async (payload: MondayWebhookPayload) => {
	const pulseId = payload.event?.pulseId ?? payload.body?.pulseId;
	console.log("[ensureWorkItem] Fetching item with pulseId:", pulseId);

	if (!pulseId) {
		console.log("[ensureWorkItem] No pulseId found in payload.");
		return null;
	}

	const item = await fetchItemWithSubitems(Number(pulseId));
	console.log("[ensureWorkItem] Fetched item:", {
		id: item?.id,
		name: item?.name,
		boardId: item?.board?.id,
		subitemsCount: item?.subitems?.length ?? 0,
		subitems: item?.subitems?.map((s) => ({ id: s.id, name: s.name })),
	});

	if (!item) return null;

	return {
		columnValues: item.column_values,
		boardId: item.board?.id,
		subitems: item.subitems,
		event: { ...payload.event, pulseName: item.name, groupId: item.group?.id, boardId: item.board?.id },
	};
};
