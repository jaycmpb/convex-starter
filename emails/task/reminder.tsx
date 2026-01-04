import { Button, EmailLayout } from "@emails/_components";
import { Heading, Section, Text } from "@react-email/components";

interface TaskReminderEmailProps {
	/** The recipient's first name. */
	firstName: string;
	/** The task name. */
	taskName: string;
	/** The work item name (if available). */
	workItemName?: string;
	/** The dashboard URL. */
	dashboardUrl: string;
	/** Optional task description. */
	description?: string;
	/** Optional due date timestamp. */
	dueAt?: number;
	/** Number of days the task has been incomplete. */
	daysIncomplete: number;
}

/**
 * Email template for reminding users about incomplete tasks.
 */
export function TaskReminderEmail({ firstName, taskName, workItemName, dashboardUrl, description, dueAt, daysIncomplete }: TaskReminderEmailProps) {
	const dueDateText = dueAt ? new Date(dueAt).toLocaleDateString() : null;

	return (
		<EmailLayout preview={`Reminder: ${taskName} Is Still Incomplete`}>
			<Section className="px-10 py-12">
				<Heading as="h2" className="text-black text-xl font-semibold m-0 mb-2">
					Task Reminder
				</Heading>
				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					Hi {firstName},
				</Text>

				<Text className="text-gray-700 text-base m-0 mb-6 leading-relaxed">
					This is a reminder that the following task has been incomplete for {daysIncomplete} day{daysIncomplete !== 1 ? "s" : ""}:
				</Text>

				<Section className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<Text className="text-black text-lg font-semibold m-0 mb-2">{taskName}</Text>
					{workItemName && (
						<Text className="text-gray-600 text-sm m-0 mb-2">Work Item: {workItemName}</Text>
					)}
					{description && (
						<Text className="text-gray-700 text-sm m-0 mb-2">{description}</Text>
					)}
					{dueDateText && (
						<Text className="text-gray-600 text-sm m-0">Due Date: {dueDateText}</Text>
					)}
				</Section>

				<Section className="mb-6">
					<Button href={dashboardUrl}>View Task</Button>
				</Section>

				<Text className="text-gray-600 text-sm m-0">
					Please review and complete this task when you have a chance.
				</Text>
			</Section>
		</EmailLayout>
	);
}

/** Preview props for development. */
TaskReminderEmail.PreviewProps = {
	firstName: "Sarah",
	taskName: "Review Q4 Financial Statements",
	workItemName: "2024 Tax Preparation",
	dashboardUrl: "https://dashboard.example.com/dashboard/work-items",
	description: "Please review the financial statements for Q4 2024 and provide feedback.",
	dueAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
	daysIncomplete: 3,
} satisfies TaskReminderEmailProps;

export default TaskReminderEmail;

