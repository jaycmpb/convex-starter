import { internal } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import { ensureItem, NormalizedContact, normalizeContact } from "@convex/src/webhooks/monday/contacts/helpers";
import type { MondayHandler, MondayHandlerResult } from "@convex/src/webhooks/monday/types";

/** The group ID for "All Contacts" - only process events from this group. */
const CONTACTS_GROUP_ID = "group_mkz6hksg";


/**
 * Execute the createFromMonday action with error handling.
 */
const createContact = async (ctx: ActionCtx, contact: NormalizedContact): Promise<MondayHandlerResult> => {
	if (!contact.email || !contact.name) {
		return { status: 400, json: { success: false, error: "Email and name are required." } };
	}

	try {
		await ctx.runAction(internal.src.users.actions.createFromMonday, {
			email: contact.email,
			name: contact.name,
			externalId: contact.externalId,
			firstName: contact.firstName,
			lastName: contact.lastName,
			phone: contact.phone,
		});
		return { status: 200, json: { success: true } };
	} catch (error: any) {
		return { status: 500, json: { success: false, error: error?.message ?? "Internal server error." } };
	}
};

/**
 * Handle Monday.com column updates by creating or updating a contact.
 * Only processes events from the "All Contacts" group.
 */
export const handleUpdateColumnValue: MondayHandler = async (ctx, { body, event }) => {
	// Ignore events from other groups.
	if (event?.groupId && event.groupId !== CONTACTS_GROUP_ID) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureItem({ body, event });
	const normalized = normalizeContact({
		body,
		event: enriched?.event ?? event,
		columnValues: enriched?.columnValues,
	});

	return createContact(ctx, normalized);
};

/**
 * Handle Monday.com item creation (create_pulse) for contacts.
 * Only processes items created in the "All Contacts" group.
 */
export const handleCreatePulse: MondayHandler = async (ctx, payload) => {
	const enriched = await ensureItem(payload);
	if (!enriched) {
		return { status: 400, json: { success: false, error: "Unable to fetch Monday item for create." } };
	}

	// Ignore items created in other groups.
	if (enriched.event?.groupId && enriched.event.groupId !== CONTACTS_GROUP_ID) {
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeContact({
		body: payload.body,
		event: enriched.event,
		columnValues: enriched.columnValues,
	});

	return createContact(ctx, normalized);
};

/**
 * Handle Monday.com item moved between groups for contacts.
 * Only processes items moved into the "All Contacts" group.
 */
export const handleMovePulseIntoGroup: MondayHandler = async (ctx, payload) => {
	// Ignore moves to other groups.
	if (payload.event?.destGroupId && payload.event.destGroupId !== CONTACTS_GROUP_ID) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureItem(payload);
	if (!enriched) {
		return { status: 400, json: { success: false, error: "Unable to fetch Monday item for move." } };
	}

	const normalized = normalizeContact({
		body: payload.body,
		event: enriched.event,
		columnValues: enriched.columnValues,
	});

	if (!normalized.externalId) {
		normalized.externalId = payload.event?.pulseId ? String(payload.event.pulseId) : undefined;
	}

	if (!normalized.name) {
		normalized.name = enriched.event?.pulseName;
	}

	return createContact(ctx, normalized);
};

/**
 * All contact event handlers mapped by Monday.com event type.
 */
export const contactHandlers: Record<string, MondayHandler> = {
	update_column_value: handleUpdateColumnValue,
	create_pulse: handleCreatePulse,
	move_pulse_into_group: handleMovePulseIntoGroup,
};
