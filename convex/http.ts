import { ActionCtx } from "@convex/_generated/server";
import webhooksRouter from "@convex/src/webhooks/http";
import { Scalar } from "@scalar/hono-api-reference";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";

const app: HonoWithConvex<ActionCtx> = new Hono();

// OpenAPI documentation route.
app.basePath("/api").get(
	"/openapi",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Convex API",
				version: "1.0.0",
				description: "Convex API",
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
						description: "Authentication Token",
					},
				},
			},
		},
	}),
);

app.basePath("/api").get("/scalar", Scalar({ url: "/api/openapi" }));

// Create route groups for the app, ex:
// app.basePath("/api").route("/users", usersRouter);
app.basePath("/api").route("/webhooks", webhooksRouter);

export default new HttpRouterWithHono(app);
