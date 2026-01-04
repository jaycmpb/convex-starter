import { fetchItem } from "@convex/src/webhooks/monday/client";
import { extractStatus, extractValue, parseColumnValues, TEAM_COLUMNS, type MondayColumnValue } from "@convex/src/webhooks/monday/helpers";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

export type TeamRole = "owner" | "admin" | "member";

export type NormalizedTeamMember = {
	email?: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	role?: TeamRole;
	name?: string;
	externalId?: string;
	isActive?: boolean;
};

/**
 * Parse and validate team role from Monday.com value.
 */
const parseRole = (value?: string): TeamRole | undefined => {
	if (!value) return undefined;
	const normalized = value.toLowerCase().trim() as TeamRole;
	if (normalized === "owner" || normalized === "admin" || normalized === "member") {
		return normalized;
	}
	return undefined;
};

/**
 * Normalize team member data from Monday.com webhook payload and column values.
 */
export const normalizeTeamMember = (input: { body: Record<string, any>; event: Record<string, any>; columnValues?: any }): NormalizedTeamMember => {
	const columnValues = parseColumnValues(input.columnValues ?? input.event?.columnValues);

	const email = input.body.email ?? extractValue(columnValues, TEAM_COLUMNS.email);
	const firstName = input.body.firstName ?? extractValue(columnValues, TEAM_COLUMNS.firstName);
	const lastName = input.body.lastName ?? extractValue(columnValues, TEAM_COLUMNS.lastName);
	const phone = input.body.phone ?? extractValue(columnValues, TEAM_COLUMNS.phone);
	const rawRole = input.body.role ?? extractValue(columnValues, TEAM_COLUMNS.role);
	const role = parseRole(rawRole);
	const name = input.body.name ?? input.event?.pulseName ?? [firstName, lastName].filter(Boolean).join(" ").trim();
	const externalId = input.body.externalId ?? (input.event?.pulseId ? String(input.event.pulseId) : undefined);
	const isActive = input.body.isActive !== undefined ? input.body.isActive : extractStatus(columnValues, TEAM_COLUMNS.status);

	return { email, firstName, lastName, phone, role, name, externalId, isActive };
};

/**
 * Fetch and enrich a Monday.com team member item by pulse ID.
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

