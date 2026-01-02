import { internal } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import { ensureClientItem, NormalizedClient, normalizeClient } from "@convex/src/webhooks/monday/clients/helpers";
import type { MondayHandler, MondayHandlerResult } from "@convex/src/webhooks/monday/types";

/** The group ID for "All Clients" - only process events from this group. */
const CLIENTS_GROUP_ID = "group_title";


/**
 * Upsert client and sync contact access.
 */
const syncClient = async (ctx: ActionCtx, client: NormalizedClient): Promise<MondayHandlerResult> => {
	if (!client.externalId || !client.name) {
		return { status: 400, json: { success: false, error: "Client name and external ID are required." } };
	}

	try {
		// Upsert the account.
		await ctx.runMutation(internal.src.accounts.mutations.upsertAccountByExternalId, {
			name: client.name,
			type: client.type ?? "personal",
			externalId: client.externalId,
		});

		// Sync contact access if we have contact IDs.
		if (client.contactExternalIds.length > 0 || client.externalId) {
			await ctx.runMutation(internal.src.accounts.mutations.syncAccountAccessFromMonday, {
				accountExternalId: client.externalId,
				contactExternalIds: client.contactExternalIds,
			});
		}

		return { status: 200, json: { success: true } };
	} catch (error: any) {
		return { status: 500, json: { success: false, error: error?.message ?? "Internal server error." } };
	}
};

/**
 * Handle Monday.com column updates by updating a client.
 * Only processes events from the "All Clients" group.
 */
export const handleUpdateColumnValue: MondayHandler = async (ctx, { body, event }) => {
	// Ignore events from other groups.
	if (event?.groupId && event.groupId !== CLIENTS_GROUP_ID) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureClientItem({ body, event });
	const normalized = normalizeClient({
		body,
		event: enriched?.event ?? event,
		columnValues: enriched?.columnValues,
	});

	return syncClient(ctx, normalized);
};

/**
 * Handle Monday.com item creation (create_pulse) for clients.
 * Only processes items created in the "All Clients" group.
 */
export const handleCreatePulse: MondayHandler = async (ctx, payload) => {
	const enriched = await ensureClientItem(payload);
	if (!enriched) {
		return { status: 400, json: { success: false, error: "Unable to fetch Monday item for create." } };
	}

	// Ignore items created in other groups.
	if (enriched.event?.groupId && enriched.event.groupId !== CLIENTS_GROUP_ID) {
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeClient({
		body: payload.body,
		event: enriched.event,
		columnValues: enriched.columnValues,
	});

	return syncClient(ctx, normalized);
};

/**
 * Handle Monday.com item moved between groups for clients.
 * Only processes items moved into the "All Clients" group.
 */
export const handleMovePulseIntoGroup: MondayHandler = async (ctx, payload) => {
	// Ignore moves to other groups.
	if (payload.event?.destGroupId && payload.event.destGroupId !== CLIENTS_GROUP_ID) {
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureClientItem(payload);
	if (!enriched) {
		return { status: 400, json: { success: false, error: "Unable to fetch Monday item for move." } };
	}

	const normalized = normalizeClient({
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

	return syncClient(ctx, normalized);
};

/**
 * All client event handlers mapped by Monday.com event type.
 */
export const clientHandlers: Record<string, MondayHandler> = {
	update_column_value: handleUpdateColumnValue,
	create_pulse: handleCreatePulse,
	move_pulse_into_group: handleMovePulseIntoGroup,
};

