import { ActionCtx } from "@convex/_generated/server";
import { clientHandlers } from "@convex/src/webhooks/monday/clients/handlers";
import { contactHandlers } from "@convex/src/webhooks/monday/contacts/handlers";
import { taskHandlers } from "@convex/src/webhooks/monday/tasks/handlers";
import { workItemHandlers } from "@convex/src/webhooks/monday/workItems/handlers";
import type { MondayHandler, MondayHandlerResult, MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

/**
 * Handler registry mapping [entityType][eventType] to handlers.
 * Add new entity types as keys, with their supported event handlers nested inside.
 */
const handlers: Record<string, Record<string, MondayHandler>> = {
	"contact": contactHandlers,
	"client": clientHandlers,
	"task": taskHandlers,
	"work-item": workItemHandlers,
};

/**
 * Dispatch Monday.com events to a handler based on entity type and event type.
 * Entity type comes from the query parameter (e.g., `?type=contact`).
 * Event type comes from the webhook payload (e.g., `move_pulse_into_group`).
 */
export const dispatchMondayEvent = async (ctx: ActionCtx, entityType: string | undefined, payload: MondayWebhookPayload): Promise<MondayHandlerResult> => {
	// Require entity type from query parameter.
	if (!entityType) {
		return { status: 400, json: { success: false, error: "Missing required 'type' query parameter." } };
	}

	const eventType = payload.event?.type ?? payload.body?.type;
	if (!eventType) {
		return { status: 400, json: { success: false, error: "Missing event type in webhook payload." } };
	}

	const entityHandlers = handlers[entityType];
	if (!entityHandlers) {
		return { status: 400, json: { success: false, error: `Unsupported entity type '${entityType}'.` } };
	}

	const handler = entityHandlers[eventType];
	if (!handler) {
		console.log("[Monday] Unhandled event type:", {
			entityType,
			eventType,
			pulseId: payload.event?.pulseId ?? payload.body?.pulseId,
			payload: JSON.stringify(payload).slice(0, 500),
		});
		return { status: 400, json: { success: false, error: `Unsupported event type '${eventType}' for entity '${entityType}'.` } };
	}

	return handler(ctx, payload);
};
