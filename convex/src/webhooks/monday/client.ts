import { ApiClient } from "@mondaydotcomorg/api";

const monday = new ApiClient({ token: process.env.MONDAY_API_KEY ?? "" });

export type MondayItem = {
	id: string;
	name: string;
	board: { id: string };
	group: { id: string; title: string };
	column_values: { id: string; text?: string | null; value?: string | null }[];
};

type ItemsQueryResponse = {
	items: MondayItem[];
};

/**
 * Fetch a Monday.com item by pulse ID via GraphQL.
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
        column_values { id text value }
      }
    }
  `;

	const variables = { itemId: [String(pulseId)] };
	const res = await monday.request<ItemsQueryResponse>(query, variables);
	return res?.items?.[0] ?? null;
};
