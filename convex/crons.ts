import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily cron job to check for tasks that have been incomplete for 3+ days
 * and send reminder notifications.
 * Runs every day at 9 AM UTC.
 */
crons.daily(
	"checkOverdueTasks",
	{
		hourUTC: 9,
		minuteUTC: 0,
	},
	internal.src.notifications.crons.checkOverdueTasks,
);

export default crons;

