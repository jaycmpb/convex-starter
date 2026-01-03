import { EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface OTPEmailProps {
	/** The one-time password code. */
	code: string;
	/** How long the code is valid for (e.g., "10 minutes"). */
	expiresIn?: string;
}

/**
 * Email template for OTP authentication codes.
 */
export function OTPEmail({ code, expiresIn = "10 minutes" }: OTPEmailProps) {
	return (
		<EmailLayout preview={`Your verification code is ${code}`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Your Verification Code
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">To complete your sign-in, please use the verification code below:</Text>

				<Section className="inline-block bg-white border border-gray-300 rounded-md px-6 py-4 mb-6">
					<Text className="m-0 text-3xl font-mono font-bold tracking-wider text-black">{code}</Text>
				</Section>

				<Text className="text-gray-600 text-sm m-0 mb-0.5">This code will expire in {expiresIn}.</Text>
				<Text className="text-gray-500 text-xs m-0">Didn't request this? Please disregard this message.</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
OTPEmail.PreviewProps = {
	code: "482916",
	expiresIn: "10 minutes",
} satisfies OTPEmailProps;

export default OTPEmail;
