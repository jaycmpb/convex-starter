import { ActionCtx } from "@convex/_generated/server";
import { clientHandlers } from "@convex/src/webhooks/monday/clients/handlers";
import { contactHandlers } from "@convex/src/webhooks/monday/contacts/handlers";
import { teamHandlers } from "@convex/src/webhooks/monday/team/handlers";
import { taskHandlers } from "@convex/src/webhooks/monday/tasks/handlers";
import { updateHandlers } from "@convex/src/webhooks/monday/updates/handlers";
import { workItemHandlers } from "@convex/src/webhooks/monday/workItems/handlers";
import type { MondayHandler, MondayHandlerResult, MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

/**
 * Handler registry mapping [entityType][eventType] to handlers.
 * Add new entity types as keys, with their supported event handlers nested inside.
 */
const handlers: Record<string, Record<string, MondayHandler>> = {
	contact: contactHandlers,
	client: clientHandlers,
	team: teamHandlers,
	task: taskHandlers,
	update: updateHandlers,
	"work-item": workItemHandlers,
};

/**
 * Dispatch Monday.com events to a handler based on entity type and event type.
 * Entity type comes from the query parameter (e.g., `?type=contact`).
 * Event type comes from the webhook payload (e.g., `move_pulse_into_group`).
 */
export const dispatchMondayEvent = async (ctx: ActionCtx, entityType: string | undefined, payload: MondayWebhookPayload): Promise<MondayHandlerResult> => {
	console.log("[Monday] Dispatching event:", {
		entityType,
		eventType: payload.event?.type ?? payload.body?.type,
		pulseId: payload.event?.pulseId ?? payload.body?.pulseId,
		boardId: payload.event?.boardId ?? payload.body?.boardId,
		groupId: payload.event?.groupId ?? payload.body?.groupId,
	});

	// Require entity type from query parameter.
	if (!entityType) {
		console.error("[Monday] Missing entity type in query parameter");
		return { status: 400, json: { success: false, error: "Missing required 'type' query parameter." } };
	}

	const eventType = payload.event?.type ?? payload.body?.type;
	if (!eventType) {
		console.error("[Monday] Missing event type in payload:", {
			payloadKeys: Object.keys(payload),
			eventKeys: payload.event ? Object.keys(payload.event) : [],
			bodyKeys: payload.body ? Object.keys(payload.body) : [],
		});
		return { status: 400, json: { success: false, error: "Missing event type in webhook payload." } };
	}

	const entityHandlers = handlers[entityType];
	if (!entityHandlers) {
		console.error("[Monday] Unsupported entity type:", {
			entityType,
			availableTypes: Object.keys(handlers),
		});
		return { status: 400, json: { success: false, error: `Unsupported entity type '${entityType}'.` } };
	}

	const handler = entityHandlers[eventType];
	if (!handler) {
		console.log("[Monday] Unhandled event type:", {
			entityType,
			eventType,
			availableHandlers: Object.keys(entityHandlers),
			pulseId: payload.event?.pulseId ?? payload.body?.pulseId,
			payload: JSON.stringify(payload).slice(0, 500),
		});
		return { status: 400, json: { success: false, error: `Unsupported event type '${eventType}' for entity '${entityType}'.` } };
	}

	console.log("[Monday] Calling handler:", { entityType, eventType });
	try {
		const result = await handler(ctx, payload);
		console.log("[Monday] Handler completed:", {
			entityType,
			eventType,
			status: result.status,
			success: result.json?.success,
		});
		return result;
	} catch (error: any) {
		console.error("[Monday] Handler error:", {
			entityType,
			eventType,
			error: error?.message,
			stack: error?.stack,
		});
		return { status: 500, json: { success: false, error: error?.message ?? "Internal server error." } };
	}
};
