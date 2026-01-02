import { fetchItem } from "@convex/src/webhooks/monday/client";
import { CLIENT_COLUMNS, extractValue, type MondayColumnValue, parseColumnValues } from "@convex/src/webhooks/monday/helpers";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

export type NormalizedClient = {
	name?: string;
	externalId?: string;
	type?: "personal" | "business";
	contactExternalIds: string[];
};

/**
 * Extract linked item IDs from a board_relation column value.
 * Supports both the `linked_items` array (from GraphQL) and the `value` JSON (from webhooks).
 */
const extractLinkedIds = (values: MondayColumnValue[], columnId: string): string[] => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return [];

	// First try linked_items array (from GraphQL query).
	if (entry.linked_items && Array.isArray(entry.linked_items) && entry.linked_items.length > 0) {
		return entry.linked_items.map((item) => String(item.id));
	}

	// Fallback to parsing value JSON (from webhook payload).
	if (entry.value) {
		try {
			const parsed = JSON.parse(entry.value);
			if (parsed?.linkedPulseIds && Array.isArray(parsed.linkedPulseIds)) {
				return parsed.linkedPulseIds.map((item: { linkedPulseId: number }) => String(item.linkedPulseId));
			}
		} catch {
			// Fall through.
		}
	}

	return [];
};

/**
 * Map Monday.com type dropdown to account type.
 */
const mapClientType = (mondayType: string | undefined): "personal" | "business" => {
	if (!mondayType) return "personal";
	const normalized = mondayType.toLowerCase().trim();
	if (normalized === "organization" || normalized === "business") {
		return "business";
	}
	return "personal";
};

/**
 * Normalize client data from Monday.com webhook payload and column values.
 */
export const normalizeClient = (input: {
	body: Record<string, any>;
	event: Record<string, any>;
	columnValues?: MondayColumnValue[];
}): NormalizedClient => {
	// Use the column values directly if they're already in the right format (from fetchItem).
	// Otherwise, parse them from the event.
	const columnValues: MondayColumnValue[] = input.columnValues ?? parseColumnValues(input.event?.columnValues);

	const name = input.body.name ?? input.event?.pulseName;
	const externalId = input.body.externalId ?? (input.event?.pulseId ? String(input.event.pulseId) : undefined);
	const typeValue = extractValue(columnValues, CLIENT_COLUMNS.type);
	const type = mapClientType(typeValue);
	const contactExternalIds = extractLinkedIds(columnValues, CLIENT_COLUMNS.contacts);

	return { name, externalId, type, contactExternalIds };
};

/**
 * Fetch and enrich a Monday.com client item by pulse ID.
 */
export const ensureClientItem = async (payload: MondayWebhookPayload) => {
	const pulseId = payload.event?.pulseId ?? payload.body?.pulseId;
	if (!pulseId) return null;

	const item = await fetchItem(Number(pulseId));
	if (!item) return null;

	return {
		columnValues: item.column_values,
		event: { ...payload.event, pulseName: item.name, groupId: item.group?.id },
	};
};

