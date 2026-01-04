import { fetchItem } from "@convex/src/webhooks/monday/client";
import { CONTACT_COLUMNS, extractStatus, extractValue, parseColumnValues } from "@convex/src/webhooks/monday/helpers";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

export type NormalizedContact = {
	email?: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	name?: string;
	externalId?: string;
	isActive?: boolean;
};

/**
 * Normalize contact data from Monday.com webhook payload and column values.
 */
export const normalizeContact = (input: { body: Record<string, any>; event: Record<string, any>; columnValues?: any }): NormalizedContact => {
	const columnValues = parseColumnValues(input.columnValues ?? input.event?.columnValues);

	const email = input.body.email ?? extractValue(columnValues, CONTACT_COLUMNS.email);
	const firstName = input.body.firstName ?? extractValue(columnValues, CONTACT_COLUMNS.firstName);
	const lastName = input.body.lastName ?? extractValue(columnValues, CONTACT_COLUMNS.lastName);
	const phone = input.body.phone ?? extractValue(columnValues, CONTACT_COLUMNS.phone);
	const name = input.body.name ?? input.event?.pulseName ?? [firstName, lastName].filter(Boolean).join(" ").trim();
	const externalId = input.body.externalId ?? (input.event?.pulseId ? String(input.event.pulseId) : undefined);
	const isActive = input.body.isActive !== undefined ? input.body.isActive : extractStatus(columnValues, CONTACT_COLUMNS.status);

	return { email, firstName, lastName, phone, name, externalId, isActive };
};

/**
 * Fetch and enrich a Monday.com item by pulse ID.
 */
export const ensureItem = async (payload: MondayWebhookPayload) => {
	const pulseId = payload.event?.pulseId ?? payload.body?.pulseId;
	if (!pulseId) return null;

	const item = await fetchItem(Number(pulseId));
	if (!item) return null;

	return {
		columnValues: item.column_values,
		event: { ...payload.event, pulseName: item.name, groupId: item.group?.id },
	};
};
