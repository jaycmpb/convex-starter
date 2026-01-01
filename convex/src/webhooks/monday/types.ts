import { ActionCtx } from "@convex/_generated/server";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type MondayWebhookPayload = {
	body: Record<string, any>;
	event: Record<string, any>;
};

export type MondayHandlerResult = {
	status: ContentfulStatusCode;
	json: { success: boolean; error?: string };
};

export type MondayHandler = (ctx: ActionCtx, payload: MondayWebhookPayload) => Promise<MondayHandlerResult>;

