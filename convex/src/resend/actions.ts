import { Email } from "@convex-dev/auth/providers/Email";
import { internalAction } from "@convex/_generated/server";
import { AccountCreatedEmail } from "@emails/account-created";
import { OTPEmail } from "@emails/otp";
import { WelcomeEmail } from "@emails/welcome";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { render } from "@react-email/render";
import { v } from "convex/values";
import { Resend } from "resend";

/** Resend OTP provider for authentication. */
export const ResendOTP = Email({
	id: "resend-otp",
	apiKey: process.env.RESEND_API_KEY,
	maxAge: 60 * 15,
	async generateVerificationToken() {
		const random: RandomReader = {
			read(bytes) {
				crypto.getRandomValues(bytes);
			},
		};

		const characters = "01234567890";
		const length = 6;
		return generateRandomString(random, characters, length);
	},
	async sendVerificationRequest({ identifier: email, provider, token }) {
		const resend = new Resend(provider.apiKey);
		const html = await render(OTPEmail({ code: token }));

		const { error } = await resend.emails.send({
			from: "Do Not Reply <no-reply@notifications.ryzeware.com>",
			to: email,
			subject: "Your Verification Code",
			html,
		});

		if (error) {
			throw new Error(error.message);
		}
	},
});

/**
 * Send a welcome email to a newly created contact.
 * @param userId - The ID of the user (for logging/tracking).
 * @param email - The user's email address.
 * @param firstName - Optional first name for personalization.
 */
export const sendWelcomeEmail = internalAction({
	args: {
		userId: v.id("users"),
		email: v.string(),
		firstName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const resend = new Resend(process.env.RESEND_API_KEY);

		// Generate the dashboard URL.
		const dashboardUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/dashboard` : "#";

		// Render the email template.
		const html = await render(
			WelcomeEmail({
				firstName: args.firstName || "there",
				dashboardUrl,
			}),
		);

		const { error } = await resend.emails.send({
			from: "Welcome <no-reply@notifications.ryzeware.com>",
			to: args.email,
			subject: `Welcome${args.firstName ? `, ${args.firstName}` : ""}!`,
			html,
		});

		if (error) {
			console.error(`Failed to send welcome email to ${args.email}:`, error.message);
			throw new Error(error.message);
		}

		console.log(`Welcome email sent to ${args.email} (user: ${args.userId}).`);
	},
});


/**
 * Send an account created email to a newly created team member.
 * @param userId - The ID of the user (for logging/tracking).
 * @param email - The user's email address.
 * @param firstName - Optional first name for personalization.
 */
export const sendAccountCreatedEmail = internalAction({
	args: {
		userId: v.id("users"),
		email: v.string(),
		firstName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const resend = new Resend(process.env.RESEND_API_KEY);

		// Generate the dashboard URL.
		const dashboardUrl = process.env.SITE_URL ? `${process.env.SITE_URL}/dashboard` : "#";

		// Render the email template.
		const html = await render(
			AccountCreatedEmail({
				firstName: args.firstName || "there",
				dashboardUrl,
			}),
		);

		const { error } = await resend.emails.send({
			from: "RW Accounting <no-reply@notifications.ryzeware.com>",
			to: args.email,
			subject: "Your account has been created",
			html,
		});

		if (error) {
			console.error(`Failed to send account created email to ${args.email}:`, error.message);
			throw new Error(error.message);
		}

		console.log(`Account created email sent to ${args.email} (user: ${args.userId}).`);
	},
});
