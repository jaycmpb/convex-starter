import { Button, EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface AccountCreatedEmailProps {
	/** The team member's first name. */
	firstName: string;
	/** The dashboard URL. Defaults to "#" for placeholder. */
	dashboardUrl?: string;
}

/**
 * Email template for notifying new team members their account has been created.
 */
export function AccountCreatedEmail({ firstName, dashboardUrl = "#" }: AccountCreatedEmailProps) {
	return (
		<EmailLayout preview={`Your account has been created, ${firstName}!`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Your account has been created
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">Hi {firstName}, your team account has been set up and you're ready to go.</Text>

				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">You can now sign into the dashboard using your email address.</Text>

				<Section className="mb-6">
					<Button href={dashboardUrl}>Sign In to Dashboard</Button>
				</Section>

				<Text className="text-gray-600 text-sm m-0">If you have any questions, reach out to your team lead.</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
AccountCreatedEmail.PreviewProps = {
	firstName: "Jay",
} satisfies AccountCreatedEmailProps;

export default AccountCreatedEmail;

