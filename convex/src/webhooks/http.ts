import { ActionCtx } from "@convex/_generated/server";
import { dispatchMondayEvent } from "@convex/src/webhooks/monday/handlers";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const app: HonoWithConvex<ActionCtx> = new Hono();

app.post("/monday", async (c) => {
	const body = await c.req.json();
	const query = c.req.query();

	console.log("[Webhook] Received Monday.com webhook:", {
		queryType: query?.type,
		eventType: body?.event?.type ?? body?.type,
		pulseId: body?.event?.pulseId ?? body?.pulseId,
		boardId: body?.event?.boardId ?? body?.boardId,
		groupId: body?.event?.groupId ?? body?.groupId,
		columnId: body?.event?.columnId ?? body?.columnId,
		bodyKeys: Object.keys(body),
		eventKeys: body?.event ? Object.keys(body.event) : [],
	});

	const event = body?.event ?? body;
	const result = await dispatchMondayEvent(c.env, query?.type, { body, event });

	console.log("[Webhook] Handler result:", {
		status: result.status,
		success: result.json?.success,
		error: result.json?.error,
	});

	return c.json(result.json, result.status as ContentfulStatusCode);
});

export default app;
