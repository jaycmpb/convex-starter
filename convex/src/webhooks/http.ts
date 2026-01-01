import { ActionCtx } from "@convex/_generated/server";
import { dispatchMondayEvent } from "@convex/src/webhooks/monday/handlers";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const app: HonoWithConvex<ActionCtx> = new Hono();

app.post("/monday", async (c) => {
	const body = await c.req.json();
	const query = c.req.query();

	const event = body?.event ?? body;
	const result = await dispatchMondayEvent(c.env, query?.type, { body, event });

	return c.json(result.json, result.status as ContentfulStatusCode);
});

export default app;
