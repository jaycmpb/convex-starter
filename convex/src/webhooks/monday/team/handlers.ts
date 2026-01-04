import { internal } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import { ensureItem, NormalizedTeamMember, normalizeTeamMember } from "@convex/src/webhooks/monday/team/helpers";
import type { MondayHandler, MondayHandlerResult } from "@convex/src/webhooks/monday/types";

/** The group ID for "All Team Members" - only process events from this group. */
const TEAM_GROUP_ID = "topics";

/**
 * Execute the createFromMonday action with error handling for team members.
 */
const createTeamMember = async (ctx: ActionCtx, member: NormalizedTeamMember): Promise<MondayHandlerResult> => {
	console.log("[Team] Creating/updating team member:", {
		email: member.email,
		name: member.name,
		externalId: member.externalId,
		firstName: member.firstName,
		lastName: member.lastName,
		role: member.role,
		isActive: member.isActive,
	});

	if (!member.email || !member.name) {
		console.error("[Team] Missing required fields:", {
			hasEmail: !!member.email,
			hasName: !!member.name,
		});
		return { status: 400, json: { success: false, error: "Email and name are required." } };
	}

	try {
		await ctx.runAction(internal.src.users.actions.createFromMonday, {
			email: member.email,
			name: member.name,
			externalId: member.externalId,
			firstName: member.firstName,
			lastName: member.lastName,
			phone: member.phone,
			role: member.role,
			isStaff: true,
			isActive: member.isActive,
		});
		console.log("[Team] Successfully created/updated team member:", member.email);
		return { status: 200, json: { success: true } };
	} catch (error: any) {
		console.error("[Team] Error creating/updating team member:", {
			email: member.email,
			error: error?.message,
			stack: error?.stack,
		});
		return { status: 500, json: { success: false, error: error?.message ?? "Internal server error." } };
	}
};

/**
 * Handle Monday.com column updates by creating or updating a team member.
 * Only processes events from the "All Team Members" group.
 */
export const handleUpdateColumnValue: MondayHandler = async (ctx, { body, event }) => {
	console.log("[Team] Handling update_column_value:", {
		pulseId: event?.pulseId,
		groupId: event?.groupId,
		columnId: event?.columnId,
		expectedGroupId: TEAM_GROUP_ID,
	});

	// Ignore events from other groups.
	if (event?.groupId && event.groupId !== TEAM_GROUP_ID) {
		console.log("[Team] Ignoring event from different group:", {
			groupId: event.groupId,
			expectedGroupId: TEAM_GROUP_ID,
		});
		return { status: 200, json: { success: true } };
	}

	const enriched = await ensureItem({ body, event });
	if (!enriched) {
		console.error("[Team] Failed to fetch item:", { pulseId: event?.pulseId });
	}

	const normalized = normalizeTeamMember({
		body,
		event: enriched?.event ?? event,
		columnValues: enriched?.columnValues,
	});

	console.log("[Team] Normalized team member data:", {
		email: normalized.email,
		name: normalized.name,
		isActive: normalized.isActive,
	});

	return createTeamMember(ctx, normalized);
};

/**
 * Handle Monday.com item creation (create_pulse) for team members.
 * Only processes items created in the "All Team Members" group.
 */
export const handleCreatePulse: MondayHandler = async (ctx, payload) => {
	console.log("[Team] Handling create_pulse:", {
		pulseId: payload.event?.pulseId ?? payload.body?.pulseId,
		groupId: payload.event?.groupId ?? payload.body?.groupId,
	});

	const enriched = await ensureItem(payload);
	if (!enriched) {
		console.error("[Team] Failed to fetch item for create:", {
			pulseId: payload.event?.pulseId ?? payload.body?.pulseId,
		});
		return { status: 400, json: { success: false, error: "Unable to fetch Monday item for create." } };
	}

	// Ignore items created in other groups.
	if (enriched.event?.groupId && enriched.event.groupId !== TEAM_GROUP_ID) {
		console.log("[Team] Ignoring create from different group:", {
			groupId: enriched.event.groupId,
			expectedGroupId: TEAM_GROUP_ID,
		});
		return { status: 200, json: { success: true } };
	}

	const normalized = normalizeTeamMember({
		body: payload.body,
		event: enriched.event,
		columnValues: enriched.columnValues,
	});

	console.log("[Team] Normalized team member data:", {
		email: normalized.email,
		name: normalized.name,
		isActive: normalized.isActive,
	});

	return createTeamMember(ctx, normalized);
};

/**
 * All team member event handlers mapped by Monday.com event type.
 */
export const teamHandlers: Record<string, MondayHandler> = {
	update_column_value: handleUpdateColumnValue,
	create_pulse: handleCreatePulse,
};

