import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { Resend } from "resend";

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
		const { error } = await resend.emails.send({
			from: "Do Not Reply <no-reply@notifications.ryzeware.com>",
			to: email,
			subject: "Your Verification Code",
			html: `<p>Your verification code is <b>${token}</b>.</p>`,
		});

		if (error) {
			throw new Error(error.message);
		}
	},
});
