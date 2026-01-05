import { action } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";
import { fetchItem, updateItemColumnValue } from "@convex/src/webhooks/monday/client";
import { WORK_ITEM_COLUMNS } from "@convex/src/webhooks/monday/helpers";

/**
 * Update a work item's status in Convex and sync it to Monday.com if the work item has an external ID.
 * @param workItemId - The work item ID in Convex.
 * @param status - The new status label (e.g., "Complete", "Reviewing").
 * @returns Success status and any error message.
 */
export const updateWorkItemStatusWithMondaySync = action({
	args: {
		workItemId: v.id("workItems"),
		status: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the work item with its external ID.
		const workItem = await ctx.runQuery(internal.src.workItems.queries.getWorkItemByIdInternal, {
			id: args.workItemId,
		});

		if (!workItem) {
			return { success: false, error: "Work item not found." };
		}

		// Update status in Convex via mutation.
		await ctx.runMutation(internal.src.workItems.mutations.updateWorkItemInternal, {
			id: args.workItemId,
			status: args.status,
		});

		// If work item has an external ID, sync status to Monday.com.
		if (workItem.externalId) {
			// Fetch the item to get its actual board ID.
			const item = await fetchItem(Number(workItem.externalId));

			if (!item) {
				console.warn(`Failed to fetch Monday.com item for work item ${args.workItemId} (externalId: ${workItem.externalId})`);
				return { success: true, warning: "Work item updated in Convex but Monday.com item not found." };
			}

			// Format status value for Monday.com status column.
			// Status columns require JSON format: {"label":"Status Label"}.
			const statusValue = JSON.stringify({ label: args.status });

			const success = await updateItemColumnValue(
				workItem.externalId,
				item.board.id,
				WORK_ITEM_COLUMNS.status,
				statusValue,
			);

			if (!success) {
				console.warn(`Failed to sync work item status to Monday.com for work item ${args.workItemId}`);
				// Don't fail the whole operation if Monday sync fails.
			}
		}

		return { success: true };
	},
});
