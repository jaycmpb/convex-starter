import { Button, EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface MissingFilesRequestEmailProps {
	/** The recipient's first name. */
	firstName: string;
	/** The task name. */
	taskName: string;
	/** The work item name (if available). */
	workItemName?: string;
	/** The dashboard URL. */
	dashboardUrl: string;
	/** List of missing items. */
	missingItems: string[];
	/** Name of the staff member who sent the request. */
	senderName: string;
}

/**
 * Email template for requesting missing files from clients.
 */
export function MissingFilesRequestEmail({
	firstName,
	taskName,
	workItemName,
	dashboardUrl,
	missingItems,
	senderName,
}: MissingFilesRequestEmailProps) {
	return (
		<EmailLayout preview={`Documents Needed: ${taskName}`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Documents Needed
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					Hi {firstName},
				</Text>

				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					We need the following documents to complete your task:
				</Text>

				<Section className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<Text className="text-black text-lg font-semibold m-0 mb-2">{taskName}</Text>
					{workItemName && (
						<Text className="text-gray-600 text-sm m-0 mb-4">Work Item: {workItemName}</Text>
					)}
					<Text className="text-gray-700 text-sm font-medium m-0 mb-2">Missing Documents:</Text>
					{missingItems.map((item, index) => (
						<Text key={index} className="text-gray-700 text-sm m-0 mb-1 pl-4">
							• {item}
						</Text>
					))}
				</Section>

				<Section className="mb-6">
					<Button href={dashboardUrl}>Upload Documents</Button>
				</Section>

				<Text className="text-gray-600 text-sm m-0">
					Please upload these documents when you have them available. If you have any questions, feel free to reach out.
				</Text>

				<Text className="text-gray-600 text-sm m-0 mt-4">
					— {senderName}
				</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
MissingFilesRequestEmail.PreviewProps = {
	firstName: "Sarah",
	taskName: "Upload W-2 Forms",
	workItemName: "2024 Tax Preparation",
	dashboardUrl: "https://dashboard.example.com/dashboard/work-items",
	missingItems: ["W-2 Form from employer", "1099 forms (if applicable)", "Mortgage interest statement (1098)"],
	senderName: "John Smith",
} satisfies MissingFilesRequestEmailProps;

export default MissingFilesRequestEmail;

