import { api } from "@convex/_generated/api";
import { ActionCtx } from "@convex/_generated/server";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";

const app: HonoWithConvex<ActionCtx> = new Hono();

/**
 * Send OTP endpoint.
 * Sends a one-time password to the provided email address.
 * @param email - The email address to send the OTP to.
 * @returns Success status and message.
 */
app.post("/send-otp", async (c) => {
	const { email } = await c.req.json<{ email: string }>();

	if (!email) {
		return c.json({ success: false, error: "Email is required." }, 400);
	}

	// Check if user exists and is inactive.
	try {
		const user = await c.env.runQuery(api.src.users.queries.getUserByEmail, { email });
		if (user && user.isActive === false) {
			return c.json({ success: false, error: "Your account is inactive." }, 403);
		}
	} catch {
		// Query may fail - continue to attempt OTP send for new users.
	}

	try {
		const result = await c.env.runAction(api.auth.signIn, {
			provider: "resend-otp",
			params: { email },
		});

		if (result.started) {
			return c.json({ success: true, message: "OTP sent." });
		}
	} catch {
		// Action may throw for invalid email or rate limiting.
	}

	return c.json({ success: false, error: "Failed to send OTP." }, 400);
});

/**
 * Verify OTP endpoint.
 * Verifies the one-time password and returns authentication tokens.
 * @param email - The email address used for sign-in.
 * @param code - The OTP code received via email.
 * @returns Authentication tokens on success.
 */
app.post("/verify-otp", async (c) => {
	const { email, code } = await c.req.json<{ email: string; code: string }>();

	if (!email || !code) {
		return c.json({ success: false, error: "Email and code are required." }, 400);
	}

	try {
		const result = await c.env.runAction(api.auth.signIn, {
			provider: "resend-otp",
			params: { email, code },
		});

		if (result.tokens) {
			return c.json({
				success: true,
				token: result.tokens.token,
				refreshToken: result.tokens.refreshToken,
			});
		}
	} catch {
		// Action throws for invalid or expired codes.
	}

	return c.json({ success: false, error: "Invalid or expired code." }, 401);
});

/**
 * Refresh token endpoint.
 * Exchanges a refresh token for a new authentication token.
 * Reads the refresh token from the `x-refresh-token` HTTP-only cookie.
 * @returns New authentication token on success.
 */
app.post("/refresh", async (c) => {
	const refreshToken = getCookie(c, "x-refresh-token");

	if (!refreshToken) {
		return c.json({ success: false, error: "Refresh token is required." }, 400);
	}

	try {
		const result = await c.env.runAction(api.auth.signIn, {
			refreshToken,
		});

		if (result.tokens) {
			return c.json({
				success: true,
				token: result.tokens.token,
				refreshToken: result.tokens.refreshToken,
			});
		}
	} catch {
		// Action throws for invalid tokens.
	}

	return c.json({ success: false, error: "Invalid refresh token." }, 401);
});

export default app;
