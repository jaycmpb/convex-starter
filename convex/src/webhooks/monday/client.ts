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
	parent_item: { id: string; board: { id: string } };
};

type SubItemsQueryResponse = {
	items: MondaySubItemWithParent[];
};

/**
 * Fetch a Monday.com sub-item by pulse ID via GraphQL.
 * Includes the parent item ID for linking to work items.
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
        column_values {
          id
          text
          value
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
