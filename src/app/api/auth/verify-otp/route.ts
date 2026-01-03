import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js API route wrapper for OTP verification.
 * Handles token storage as HTTP-only cookies for security.
 */
export async function POST(request: NextRequest) {
	try {
		const { email, code } = await request.json();

		if (!email || !code) {
			return NextResponse.json(
				{ success: false, error: "Email and code are required." },
				{ status: 400 }
			);
		}

		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
		if (!convexUrl) {
			return NextResponse.json(
				{ success: false, error: "Convex URL not configured." },
				{ status: 500 }
			);
		}

		// Call the Convex HTTP endpoint
		const response = await fetch(`${convexUrl}/api/auth/verify-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, code }),
		});

		const data = await response.json();

		if (data.success && data.token) {
			// Create response with tokens
			const nextResponse = NextResponse.json({
				success: true,
				message: "Authentication successful.",
			});

			// Set HTTP-only cookies for token storage
			nextResponse.cookies.set("x-convex-access-token", data.token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 3600, // 1 hour
				path: "/",
			});

			if (data.refreshToken) {
				nextResponse.cookies.set("x-refresh-token", data.refreshToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 604800, // 7 days
					path: "/",
				});
			}

			return nextResponse;
		}

		return NextResponse.json(
			{ success: false, error: data.error || "Invalid or expired code." },
			{ status: 401 }
		);
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: "An error occurred. Please try again." },
			{ status: 500 }
		);
	}
}

