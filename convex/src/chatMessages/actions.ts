import { internalAction } from "@convex/_generated/server";
import { internal } from "@convex/_generated/api";
import { v } from "convex/values";
import { createItemUpdate } from "@convex/src/webhooks/monday/client";

/**
 * Sync a chat message to Monday.com as an update.
 * Formats contact messages with sender name prefix: [Sender Name]: Message content.
 * @param messageId - The message ID in Convex.
 * @param taskExternalId - The Monday.com sub-item pulse ID.
 * @param senderName - The sender's display name.
 * @param content - The message content.
 * @returns Success status and any error message.
 */
export const syncToMonday = internalAction({
	args: {
		messageId: v.id("chatMessages"),
		taskExternalId: v.string(),
		senderName: v.string(),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		// Get the message to check sender type.
		const message = await ctx.runQuery(internal.src.chatMessages.queries.getMessageById, {
			id: args.messageId,
		});

		if (!message) {
			return { success: false, error: "Message not found." };
		}

		// Format the message content for Monday.com.
		// Contact messages are prefixed with [Contact Name]:, employee messages are posted as-is.
		let updateBody: string;
		if (message.senderType === "contact") {
			updateBody = `[${args.senderName}]: ${args.content}`;
		} else {
			updateBody = args.content;
		}

		// Post the update to Monday.com.
		const updateId = await createItemUpdate(args.taskExternalId, updateBody);

		if (!updateId) {
			console.warn(`Failed to sync message ${args.messageId} to Monday.com`);
			return { success: false, error: "Failed to create Monday.com update." };
		}

		// Update the message with the external ID for deduplication.
		await ctx.runMutation(internal.src.chatMessages.mutations.updateMessageExternalId, {
			id: args.messageId,
			externalId: updateId,
		});

		return { success: true };
	},
});

