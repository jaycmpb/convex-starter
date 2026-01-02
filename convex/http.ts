import { ActionCtx } from "@convex/_generated/server";
import authRouter from "@convex/src/auth/http";
import webhooksRouter from "@convex/src/webhooks/http";
import { Scalar } from "@scalar/hono-api-reference";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";

const app: HonoWithConvex<ActionCtx> = new Hono();

/**
 * OpenID Connect discovery endpoint.
 * Returns the OpenID configuration for JWT verification.
 */
app.get("/.well-known/openid-configuration", async (c) => {
	const siteUrl = process.env.CONVEX_SITE_URL;

	return c.json(
		{
			issuer: siteUrl,
			jwks_uri: `${siteUrl}/.well-known/jwks.json`,
			authorization_endpoint: `${siteUrl}/oauth/authorize`,
		},
		200,
		{
			"Cache-Control": "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
		},
	);
});

/**
 * JSON Web Key Set endpoint.
 * Returns the public keys used for JWT verification.
 */
app.get("/.well-known/jwks.json", async (c) => {
	return c.text(process.env.JWKS!, 200, {
		"Content-Type": "application/json",
		"Cache-Control": "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
	});
});

// OpenAPI Documentation Route
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

// Auth Routes
app.basePath("/api").route("/auth", authRouter);

// Webhooks Routes
app.basePath("/api").route("/webhooks", webhooksRouter);

export default new HttpRouterWithHono(app);
