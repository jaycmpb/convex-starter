import { Button, EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface WorkItemCompletedEmailProps {
	/** The recipient's first name. */
	firstName: string;
	/** The work item name. */
	workItemName: string;
	/** The work item type name (e.g., "Personal Tax Returns"). */
	workItemType?: string;
	/** The dashboard URL. */
	dashboardUrl: string;
	/** The name of the person who completed the work item. */
	completedBy?: string;
}

/**
 * Email template for notifying users when a work item is marked as complete.
 */
export function WorkItemCompletedEmail({
	firstName,
	workItemName,
	workItemType,
	dashboardUrl,
	completedBy,
}: WorkItemCompletedEmailProps) {
	return (
		<EmailLayout preview={`Work item completed: ${workItemName}`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Work Item Completed
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					Hi {firstName},
				</Text>

				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					Great news! The following work item has been marked as complete:
				</Text>

				<Section className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<Text className="text-black text-lg font-semibold m-0 mb-2">{workItemName}</Text>
					{workItemType && (
						<Text className="text-gray-600 text-sm m-0 mb-2">Type: {workItemType}</Text>
					)}
					{completedBy && (
						<Text className="text-gray-600 text-sm m-0">Completed by: {completedBy}</Text>
					)}
				</Section>

				<Section className="mb-6">
					<Button href={dashboardUrl}>View Details</Button>
				</Section>

				<Text className="text-gray-600 text-sm m-0">
					You can view all your completed work items in your dashboard.
				</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
WorkItemCompletedEmail.PreviewProps = {
	firstName: "Sarah",
	workItemName: "2024 Tax Preparation",
	workItemType: "Personal Tax Returns",
	dashboardUrl: "https://dashboard.example.com/dashboard/work-items",
	completedBy: "John Doe",
} satisfies WorkItemCompletedEmailProps;

export default WorkItemCompletedEmail;

