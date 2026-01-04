import { ApiClient } from "@mondaydotcomorg/api";
import type { MondayColumnValue } from "@convex/src/webhooks/monday/helpers";

const monday = new ApiClient({ token: process.env.MONDAY_API_KEY ?? "" });

export type MondaySubItem = {
	id: string;
	name: string;
	column_values: MondayColumnValue[];
};

export type MondayItem = {
	id: string;
	name: string;
	board: { id: string };
	group: { id: string; title: string };
	column_values: MondayColumnValue[];
	subitems?: MondaySubItem[];
};

type ItemsQueryResponse = {
	items: MondayItem[];
};

/**
 * Fetch a Monday.com item by pulse ID via GraphQL.
 * Includes linked items for board_relation columns.
 */
export const fetchItem = async (pulseId: number): Promise<MondayItem | null> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const query = `
    query ($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        board { id }
        group { id title }
        column_values {
          id
          text
          value
          ... on BoardRelationValue {
            linked_items {
              id
              name
            }
          }
        }
      }
    }
  `;

	const variables = { itemId: [String(pulseId)] };
	const res = await monday.request<ItemsQueryResponse>(query, variables);
	return res?.items?.[0] ?? null;
};

/**
 * Fetch a Monday.com item with its sub-items by pulse ID via GraphQL.
 * Includes linked items for board_relation columns and all sub-items.
 */
export const fetchItemWithSubitems = async (pulseId: number): Promise<MondayItem | null> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const query = `
    query ($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        board { id }
        group { id title }
        column_values {
          id
          text
          value
          ... on BoardRelationValue {
            linked_items {
              id
              name
            }
          }
        }
        subitems {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  `;

	const variables = { itemId: [String(pulseId)] };
	const res = await monday.request<ItemsQueryResponse>(query, variables);
	return res?.items?.[0] ?? null;
};

export type MondaySubItemWithParent = MondaySubItem & {
	board: { id: string };
	parent_item: { id: string; board: { id: string } };
};

type SubItemsQueryResponse = {
	items: MondaySubItemWithParent[];
};

/**
 * Fetch a Monday.com sub-item by pulse ID via GraphQL.
 * Includes the parent item ID for linking to work items and linked_items for board relations.
 */
export const fetchSubItem = async (pulseId: number): Promise<MondaySubItemWithParent | null> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const query = `
    query ($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        board { id }
        column_values {
          id
          text
          value
          ... on BoardRelationValue {
            linked_items {
              id
              name
            }
          }
        }
        parent_item {
          id
          board { id }
        }
      }
    }
  `;

	const variables = { itemId: [String(pulseId)] };
	const res = await monday.request<SubItemsQueryResponse>(query, variables);
	return res?.items?.[0] ?? null;
};

type ChangeColumnValueResponse = {
	change_column_value: {
		id: string;
	};
};

/**
 * Update a Monday.com sub-item column value.
 * @param itemId - The sub-item pulse ID.
 * @param boardId - The board ID containing the sub-item.
 * @param columnId - The column ID to update.
 * @param value - The value to set. For status columns, use JSON format: {"label":"Status Label"}.
 * @returns True if successful, false otherwise.
 */
export const updateSubItemColumnValue = async (
	itemId: string,
	boardId: string,
	columnId: string,
	value: string,
): Promise<boolean> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const mutation = `
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(
        board_id: $boardId,
        item_id: $itemId,
        column_id: $columnId,
        value: $value
      ) {
        id
      }
    }
  `;

	try {
		const variables = {
			boardId,
			itemId,
			columnId,
			value, // Pass as JSON string, not parsed object
		};

		await monday.request<ChangeColumnValueResponse>(mutation, variables);
		return true;
	} catch (error) {
		console.error("Failed to update Monday.com column value:", error);
		return false;
	}
};

type CreateUpdateResponse = {
	create_update: {
		id: string;
	};
};

/**
 * Create an update (comment/post) on a Monday.com item or sub-item.
 * @param itemId - The item or sub-item pulse ID.
 * @param body - The update text content.
 * @returns The update ID if successful, null otherwise.
 */
export const createItemUpdate = async (itemId: string, body: string): Promise<string | null> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const mutation = `
    mutation ($itemId: ID!, $body: String!) {
      create_update(item_id: $itemId, body: $body) {
        id
      }
    }
  `;

	try {
		const variables = {
			itemId,
			body,
		};

		const res = await monday.request<CreateUpdateResponse>(mutation, variables);
		return res?.create_update?.id ?? null;
	} catch (error) {
		console.error("Failed to create Monday.com update:", error);
		return null;
	}
};

export type MondayUser = {
	id: string;
	name: string;
	email: string;
};

type UserQueryResponse = {
	users: MondayUser[];
};

/**
 * Fetch a Monday.com user by ID.
 * @param userId - The user ID.
 * @returns The user object if found, null otherwise.
 */
export const fetchUser = async (userId: number): Promise<MondayUser | null> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const query = `
    query ($userId: [ID!]) {
      users(ids: $userId) {
        id
        name
        email
      }
    }
  `;

	try {
		const variables = { userId: [String(userId)] };
		const res = await monday.request<UserQueryResponse>(query, variables);
		return res?.users?.[0] ?? null;
	} catch (error) {
		console.error("Failed to fetch Monday.com user:", error);
		return null;
	}
};

export type MondayUpdate = {
	id: string;
	body: string;
	created_at: string;
	creator: {
		id: string;
		name: string;
		email: string;
	};
};

type UpdatesQueryResponse = {
	items: Array<{
		updates: MondayUpdate[];
	}>;
};

/**
 * Fetch updates (comments/posts) for a Monday.com item or sub-item.
 * @param itemId - The item or sub-item pulse ID.
 * @returns Array of updates, ordered by creation time (oldest first).
 */
export const fetchItemUpdates = async (itemId: number): Promise<MondayUpdate[]> => {
	const token = process.env.MONDAY_API_KEY;
	if (!token) {
		throw new Error("MONDAY_API_KEY is not set.");
	}

	const query = `
    query ($itemId: [ID!]) {
      items(ids: $itemId) {
        updates {
          id
          body
          created_at
          creator {
            id
            name
            email
          }
        }
      }
    }
  `;

	try {
		const variables = { itemId: [String(itemId)] };
		const res = await monday.request<UpdatesQueryResponse>(query, variables);
		return res?.items?.[0]?.updates ?? [];
	} catch (error) {
		console.error("Failed to fetch Monday.com updates:", error);
		return [];
	}
};
