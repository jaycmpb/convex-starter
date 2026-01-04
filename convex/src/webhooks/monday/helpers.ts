/**
 * Column IDs for Monday.com Contacts board.
 */
export const CONTACT_COLUMNS = {
	email: "email_mkz5kwjg",
	firstName: "text_mkz5zcdf",
	lastName: "text_mkz5ehks",
	phone: "phone_mkz5semw",
	status: "status",
};

/**
 * Column IDs for Monday.com Team board.
 */
export const TEAM_COLUMNS = {
	email: "email_mkz9x3wa",
	firstName: "text_mkz9jhe5",
	lastName: "text_mkz984kv",
	role: "dropdown_mkz9bhwb",
	phone: "phone_mkz9gr1p",
	status: "status",
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
 * Note: Team Assignee has different column IDs per board:
 * - Personal Tax Returns: board_relation_mkz9h3m7
 * - Business Tax Returns: board_relation_mkz93e04
 */
export const TASK_COLUMNS = {
	details: "text_mkz688n2",
	status: "status",
	assignee: "board_relation_mkz6wt8w",
	teamAssignee: ["board_relation_mkz9h3m7", "board_relation_mkz93e04"],
	dueDate: "date0",
	type: "dropdown_mkz69n1v",
	template: ["board_relation_mkz99yqy", "board_relation_mkz9jtqh"], // Personal, Business
};

/**
 * Work item board configurations mapping board ID to work item type.
 */
export const WORK_ITEM_BOARDS: Record<string, { typeName: string; accountType: "personal" | "business" }> = {
	"18393607685": { typeName: "Personal Tax Returns", accountType: "personal" },
	"18393608944": { typeName: "Business Tax Returns", accountType: "business" },
};

/**
 * Monday.com Templates board ID.
 * This board stores template references that can be linked to tasks.
 */
export const TEMPLATES_BOARD_ID = "18393823908";

/**
 * Column IDs for Monday.com Templates board.
 * Status labels: "Unlocked" (id: 1), "Locked" (id: 2).
 */
export const TEMPLATE_COLUMNS = {
	name: "name",
	convexId: "text_mkz9bx5y",
	status: "status",
	date: "date4",
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
			if (parsed?.label) return parsed.label as string;
		} catch {
			// Fall through to return raw string.
			return entry.value as string;
		}
	}

	return undefined;
};

/**
 * Extract status value from Monday column values and convert to boolean.
 * Returns true for "Active", false for "Inactive", undefined if not set.
 */
export const extractStatus = (values: MondayColumnValue[], columnId: string): boolean | undefined => {
	const statusText = extractValue(values, columnId);
	if (!statusText) return undefined;
	return statusText.toLowerCase().trim() === "active";
};

/**
 * Extract the first person's ID or email from a Monday.com people column.
 * People columns return an array of person objects with IDs or emails.
 * @param values - The column values array.
 * @param columnId - The people column ID.
 * @returns The first person's ID (as string) or email, or undefined if not found.
 */
export const extractPeopleValue = (values: MondayColumnValue[], columnId: string): string | undefined => {
	const entry = values.find((v) => v.id === columnId);
	if (!entry) return undefined;

	// Try parsing the value JSON (people columns return array of person objects).
	if (entry.value) {
		try {
			const parsed = JSON.parse(entry.value);
			if (Array.isArray(parsed) && parsed.length > 0) {
				// Monday.com people columns can have person objects with id, email, or both.
				const firstPerson = parsed[0];
				return firstPerson?.id ? String(firstPerson.id) : firstPerson?.email;
			}
		} catch {
			// Fall through to try text value.
		}
	}

	// Fallback to text value (might be email or ID as string).
	if (entry.text) {
		return entry.text;
	}

	return undefined;
};
