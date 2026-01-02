/**
 * Column IDs for Monday.com Contacts board.
 */
export const CONTACT_COLUMNS = {
	email: "email_mkz5kwjg",
	firstName: "text_mkz5zcdf",
	lastName: "text_mkz5ehks",
	phone: "phone_mkz5semw",
};

/**
 * Column IDs for Monday.com Clients board.
 */
export const CLIENT_COLUMNS = {
	contacts: "board_relation_mkz5jhxq",
	type: "dropdown_mkz5xtmb",
	status: "status",
};

/**
 * Monday.com Clients board ID.
 */
export const CLIENTS_BOARD_ID = "18393606467";

/**
 * Column IDs for Monday.com Work Item boards (Personal/Business Tax Returns).
 */
export const WORK_ITEM_COLUMNS = {
	client: "board_relation_mkz6499c",
	status: "status",
	deadline: "date_mkz6cbd3",
};

/**
 * Column IDs for Monday.com Task sub-items.
 */
export const TASK_COLUMNS = {
	details: "text_mkz688n2",
	status: "status",
	assignee: "board_relation_mkz6wt8w",
	dueDate: "date0",
};

/**
 * Work item board configurations mapping board ID to work item type.
 */
export const WORK_ITEM_BOARDS: Record<string, { typeName: string; accountType: "personal" | "business" }> = {
	"18393607685": { typeName: "Personal Tax Returns", accountType: "personal" },
	"18393608944": { typeName: "Business Tax Returns", accountType: "business" },
};

/**
 * Monday.com column value shape.
 */
export type MondayColumnValue = {
	id: string;
	value?: string | null;
	text?: string | null;
	linked_items?: { id: string; name: string }[];
};

/**
 * Parse Monday column values from the webhook payload.
 */
export const parseColumnValues = (columnValues: unknown): MondayColumnValue[] => {
	if (!columnValues) return [];

	if (Array.isArray(columnValues)) {
		return columnValues as MondayColumnValue[];
	}

	if (typeof columnValues === "string") {
		try {
			const parsed = JSON.parse(columnValues);
			return Array.isArray(parsed) ? (parsed as MondayColumnValue[]) : [];
		} catch {
			return [];
		}
	}

	return [];
};

/**
 * Extract a text value from Monday column values for a given column ID.
 */
export const extractValue = (values: MondayColumnValue[], columnId: string): string | undefined => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return undefined;

	if (entry.text) return entry.text ?? undefined;

	if (entry.value) {
		try {
			const parsed = JSON.parse(entry.value);
			if (parsed?.email) return parsed.email as string;
			if (parsed?.phone) return parsed.phone as string;
		} catch {
			// Fall through to return raw string.
			return entry.value as string;
		}
	}

	return undefined;
};
