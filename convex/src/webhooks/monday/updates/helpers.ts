import { fetchSubItem, fetchUser } from "@convex/src/webhooks/monday/client";
import type { MondayWebhookPayload } from "@convex/src/webhooks/monday/types";

/**
 * Extract the update ID from the webhook payload.
 */
export const extractUpdateId = (payload: MondayWebhookPayload): string | null => {
	const updateId = payload.event?.updateId ?? payload.body?.updateId ?? null;
	return updateId != null ? String(updateId) : null;
};

/**
 * Extract the item/sub-item ID from the webhook payload.
 */
export const extractItemId = (payload: MondayWebhookPayload): string | null => {
	const pulseId = payload.event?.pulseId ?? payload.body?.pulseId ?? null;
	return pulseId != null ? String(pulseId) : null;
};

/**
 * Parse update body text from the webhook payload.
 * Removes the [Contact Name]: prefix if present for contact messages.
 * Returns userId for employee messages so the caller can fetch the user's name.
 */
export const parseUpdateBody = (payload: MondayWebhookPayload): { body: string; senderName: string; senderType: "contact" | "employee"; userId?: number } | null => {
	const bodyText = payload.event?.textBody ?? payload.body?.textBody ?? payload.event?.body ?? payload.body?.body ?? null;
	if (!bodyText) {
		return null;
	}

	// Check if the message has the [Contact Name]: prefix.
	const contactPrefixMatch = bodyText.match(/^\[([^\]]+)\]:\s*(.+)$/);
	if (contactPrefixMatch) {
		return {
			body: contactPrefixMatch[2].trim(),
			senderName: contactPrefixMatch[1].trim(),
			senderType: "contact" as const,
		};
	}

	// Employee messages don't have the prefix.
	// Return userId so the caller can fetch the user's name from Monday API.
	const userId = payload.event?.userId ?? payload.body?.userId ?? null;
	return {
		body: bodyText,
		senderName: "Employee", // Placeholder, will be resolved by ensureUpdate.
		senderType: "employee" as const,
		userId: typeof userId === "number" ? userId : undefined,
	};
};

/**
 * Enrich update payload with sub-item data.
 * Fetches the sub-item to get its parent item and board information.
 * For employee messages, fetches the user's name from Monday API.
 */
export const ensureUpdate = async (
	payload: MondayWebhookPayload,
): Promise<{
	itemId: string;
	updateId: string;
	body: string;
	senderName: string;
	senderType: "contact" | "employee";
	boardId: string;
	subitem: { id: string; parent_item: { id: string; board: { id: string } } };
} | null> => {
	const itemId = extractItemId(payload);
	const updateId = extractUpdateId(payload);

	if (!itemId || !updateId) {
		return null;
	}

	const parsed = parseUpdateBody(payload);
	if (!parsed) {
		return null;
	}

	const subitem = await fetchSubItem(Number(itemId));
	if (!subitem || !subitem.parent_item) {
		return null;
	}

	// Resolve sender name for employee messages by fetching user from Monday API.
	let senderName = parsed.senderName;
	if (parsed.senderType === "employee" && parsed.userId) {
		const user = await fetchUser(parsed.userId);
		if (user?.name) {
			senderName = user.name;
		}
	}

	return {
		itemId,
		updateId,
		body: parsed.body,
		senderName,
		senderType: parsed.senderType,
		boardId: subitem.board.id,
		subitem,
	};
};

