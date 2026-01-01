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
 * Monday.com column value shape.
 */
export type MondayColumnValue = {
	id: string;
	value?: string | null;
	text?: string | null;
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
