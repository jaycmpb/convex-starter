import { internalAction } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";
import { createItem, updateItemColumnValue } from "@convex/src/webhooks/monday/client";
import { TEMPLATES_BOARD_ID, TEMPLATE_COLUMNS } from "@convex/src/webhooks/monday/helpers";

/**
 * Sync a template to Monday.com.
 * Creates an item on the Templates board with the template name and Convex ID.
 * @param templateId - The template ID to sync.
 */
export const syncTemplateToMonday = internalAction({
	args: {
		templateId: v.id("templates"),
	},
	handler: async (ctx, args) => {
		// Get template from internal query.
		const template = await ctx.runQuery(internal.src.templates.queries.getTemplateForSync, {
			templateId: args.templateId,
		});

		if (!template) {
			console.error("[syncTemplateToMonday] Template not found:", args.templateId);
			return;
		}

		// Skip if already synced.
		if (template.externalId) {
			console.log("[syncTemplateToMonday] Template already synced:", template.externalId);
			return;
		}

		// Check if board ID is configured.
		if (!TEMPLATES_BOARD_ID) {
			console.error("[syncTemplateToMonday] TEMPLATES_BOARD_ID not configured. Please create the Templates board first.");
			return;
		}

		// Create item on Monday.com board.
		const itemId = await createItem(TEMPLATES_BOARD_ID, template.name);
		if (!itemId) {
			console.error("[syncTemplateToMonday] Failed to create Monday.com item for template:", template._id);
			return;
		}

		// Update Convex ID column (text column - pass as JSON string).
		if (TEMPLATE_COLUMNS.convexId && typeof TEMPLATE_COLUMNS.convexId === "string") {
			const success = await updateItemColumnValue(itemId, TEMPLATES_BOARD_ID, TEMPLATE_COLUMNS.convexId, JSON.stringify(template._id));
			if (!success) {
				console.error("[syncTemplateToMonday] Failed to update Convex ID column for item:", itemId);
			}
		}

		// Set status to Unlocked by default (new templates are unlocked).
		const statusSuccess = await updateItemColumnValue(itemId, TEMPLATES_BOARD_ID, TEMPLATE_COLUMNS.status, JSON.stringify({ label: "Unlocked" }));
		if (!statusSuccess) {
			console.error("[syncTemplateToMonday] Failed to set status column for item:", itemId);
		}

		// Update template with external ID.
		await ctx.runMutation(internal.src.templates.mutations.updateTemplateExternalId, {
			id: template._id,
			externalId: itemId,
		});

		console.log("[syncTemplateToMonday] Successfully synced template to Monday.com:", {
			templateId: template._id,
			mondayItemId: itemId,
		});
	},
});

