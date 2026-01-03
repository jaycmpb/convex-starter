import { Section, Text } from "@react-email/components";

interface DetailsBoxProps {
	/** The label text above the details box. */
	label?: string;
	/** The content to display inside the box. */
	children: React.ReactNode;
}

/**
 * A styled details box with a left border accent.
 */
export function DetailsBox({ label = "Details", children }: DetailsBoxProps) {
	return (
		<Section>
			<Text className="text-gray-600 text-xs font-medium uppercase tracking-wide m-0 mb-2">{label}</Text>
			<Section className="bg-gray-50 border-l-4 border-black px-4 py-3 rounded-r-lg">
				<Text className="m-0 text-gray-900 text-sm">{children}</Text>
			</Section>
		</Section>
	);
}
