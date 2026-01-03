export { OTPEmail } from "@emails/otp";
export { WelcomeEmail } from "@emails/welcome";
export { TaskAssignedEmail } from "@emails/task/assigned";
export { TaskCompletedEmail } from "@emails/task/completed";
export { TaskReminderEmail } from "@emails/task/reminder";
export { WorkItemCompletedEmail } from "@emails/work-item/completed";

// Re-export components for custom email templates.
export * from "@emails/_components";
