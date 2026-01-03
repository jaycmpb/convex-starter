import { Button, EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface WelcomeEmailProps {
	/** The contact's first name. */
	firstName: string;
	/** The dashboard URL. Defaults to "#" for placeholder. */
	dashboardUrl?: string;
}

/**
 * Email template for welcoming new contacts.
 */
export function WelcomeEmail({ firstName, dashboardUrl = "#" }: WelcomeEmailProps) {
	return (
		<EmailLayout preview={`Welcome, ${firstName}!`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Welcome, {firstName}!
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">We're excited to work with you for your tax and accounting needs.</Text>

				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					You're now able to sign into your account to access your financial information, documents, and more.
				</Text>

				<Section className="mb-6">
					<Button href={dashboardUrl}>Go to Dashboard</Button>
				</Section>

				<Text className="text-gray-700 text-base m-0 mb-4 leading-relaxed">
					You'll receive important updates and notifications from us at this email address. If you have any questions or need assistance, please don't hesitate to reach
					out.
				</Text>

				<Text className="text-gray-600 text-sm m-0">We look forward to working with you!</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
WelcomeEmail.PreviewProps = {
	firstName: "Sarah",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
