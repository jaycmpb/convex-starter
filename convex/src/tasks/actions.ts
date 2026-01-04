import { action } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";
import { fetchSubItem, updateSubItemColumnValue } from "@convex/src/webhooks/monday/client";
import { TASK_COLUMNS } from "@convex/src/webhooks/monday/helpers";

/**
 * Update a task's status in Convex and sync it to Monday.com if the task has an external ID.
 * @param taskId - The task ID in Convex.
 * @param status - The new status label (e.g., "Client Responded").
 * @returns Success status and any error message.
 */
export const updateTaskStatusWithMondaySync = action({
	args: {
		taskId: v.id("tasks"),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the task with its external ID.
		const task = await ctx.runQuery(internal.src.tasks.queries.getTaskByIdInternal, {
			id: args.taskId,
		});

		if (!task) {
			return { success: false, error: "Task not found." };
		}

		// Update status in Convex via mutation.
		await ctx.runMutation(internal.src.tasks.mutations.updateTaskInternal, {
			id: args.taskId,
			status: args.status,
		});

		// If task has an external ID, sync status to Monday.com.
		if (task.externalId) {
			// Fetch the sub-item to get its actual board ID.
			const subItem = await fetchSubItem(Number(task.externalId));

			if (!subItem) {
				console.warn(`Failed to fetch Monday.com sub-item for task ${args.taskId} (externalId: ${task.externalId})`);
				return { success: true, warning: "Task updated in Convex but Monday.com sub-item not found." };
			}

			// Format status value for Monday.com status column.
			// Status columns require JSON format: {"label":"Status Label"}.
			const statusValue = JSON.stringify({ label: args.status });

			const success = await updateSubItemColumnValue(
				task.externalId,
				subItem.board.id,
				TASK_COLUMNS.status,
				statusValue,
			);

			if (!success) {
				console.warn(`Failed to sync task status to Monday.com for task ${args.taskId}`);
				// Don't fail the whole operation if Monday sync fails.
			}
		}

		return { success: true };
	},
});

