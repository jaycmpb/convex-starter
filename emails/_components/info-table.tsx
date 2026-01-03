import { Column, Row, Section, Text } from "@react-email/components";

interface InfoTableRow {
	/** The label for the row. */
	label: string;
	/** The value for the row. */
	value: string;
}

interface InfoTableProps {
	/** Array of label/value pairs to display. */
	rows: InfoTableRow[];
}

/**
 * A simple two-column info table for displaying key-value pairs.
 */
export function InfoTable({ rows }: InfoTableProps) {
	return (
		<Section className="border border-gray-200 rounded-lg overflow-hidden">
			{rows.map((row, index) => (
				<Row key={index} className={index !== rows.length - 1 ? "border-b border-gray-100" : ""}>
					<Column className="w-[140px] bg-gray-50 px-4 py-3 align-top">
						<Text className="m-0 text-gray-600 text-xs font-medium uppercase tracking-wide">{row.label}</Text>
					</Column>
					<Column className="px-4 py-3 align-top bg-white">
						<Text className="m-0 text-black text-sm font-medium">{row.value}</Text>
					</Column>
				</Row>
			))}
		</Section>
	);
}
