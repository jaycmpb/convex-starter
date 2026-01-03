import { Button, EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface TaskCompletedEmailProps {
	/** The recipient's first name. */
	firstName: string;
	/** The task name. */
	taskName: string;
	/** The work item name (if available). */
	workItemName?: string;
	/** The dashboard URL. */
	dashboardUrl: string;
	/** The name of the person who completed the task. */
	completedBy: string;
}

/**
 * Email template for notifying users when a task is marked as complete.
 */
export function TaskCompletedEmail({ firstName, taskName, workItemName, dashboardUrl, completedBy }: TaskCompletedEmailProps) {
	return (
		<EmailLayout preview={`Task completed: ${taskName}`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Task Completed
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					Hi {firstName},
				</Text>

				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					The following task has been marked as complete:
				</Text>

				<Section className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<Text className="text-black text-lg font-semibold m-0 mb-2">{taskName}</Text>
					{workItemName && (
						<Text className="text-gray-600 text-sm m-0 mb-2">Work Item: {workItemName}</Text>
					)}
					<Text className="text-gray-600 text-sm m-0">Completed by: {completedBy}</Text>
				</Section>

				<Section className="mb-6">
					<Button href={dashboardUrl}>View Work Item</Button>
				</Section>

				<Text className="text-gray-600 text-sm m-0">
					You can view the updated status in your dashboard.
				</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
TaskCompletedEmail.PreviewProps = {
	firstName: "Sarah",
	taskName: "Review Q4 Financial Statements",
	workItemName: "2024 Tax Preparation",
	dashboardUrl: "https://dashboard.example.com/dashboard/work-items",
	completedBy: "John Doe",
} satisfies TaskCompletedEmailProps;

export default TaskCompletedEmail;

