import { Heading, Section, Text } from "@react-email/components";

interface HeaderProps {
	/** The title displayed in the header. Defaults to "MAD". */
	title?: string;
	/** The subtitle displayed under the title. Defaults to "My Accounting Dashboard". */
	subtitle?: string;
}

/**
 * Email header component with clean monochromatic design.
 */
export function Header({
	title = "MAD",
	subtitle = "My Accounting Dashboard",
}: HeaderProps) {
	return (
		<Section className="bg-black px-10 py-6">
			<Heading as="h1" className="m-0 text-white text-2xl font-bold tracking-tight mb-0">
				{title}
			</Heading>
			<Text className="m-0 text-gray-400 text-xs font-normal tracking-normal mt-1">{subtitle}</Text>
		</Section>
	);
}
