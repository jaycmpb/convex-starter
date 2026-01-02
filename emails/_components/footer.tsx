import { Hr, Link, Section, Text } from "@react-email/components";

export interface FooterProps {
	/** The firm name. Defaults to "Acme Accounting Group". */
	firmName?: string;
	/** The firm tagline. Defaults to "Professional Accounting Services". */
	tagline?: string;
	/** The firm location. Defaults to "Atlanta, GA". */
	location?: string;
	/** The firm website URL. */
	websiteUrl?: string;
	/** The firm website display text. */
	websiteDisplay?: string;
}

/**
 * Email footer component with contact info and do-not-reply notice.
 */
export function Footer({
	firmName = "Acme Accounting Group",
	tagline = "Professional Accounting Services",
	location = "Atlanta, GA",
	websiteUrl = "https://acmeaccounting.example.com",
	websiteDisplay = "acmeaccounting.example.com",
}: FooterProps) {
	return (
		<Section className="px-10 py-6 bg-gray-50 border-t border-gray-200">
			<Text className="text-xs text-gray-500 m-0 mb-4">This is an automated message. Please do not reply to this email.</Text>
			<Hr className="border-gray-300 my-3" />
			<Text className="text-xs text-gray-700 font-medium m-0">{firmName}</Text>
			<Text className="text-xs text-gray-600 m-0 mt-1">
				{tagline} • {location}
			</Text>
			<Text className="text-xs text-gray-600 m-0 mt-1">
				<Link href={websiteUrl} className="text-black underline">
					{websiteDisplay}
				</Link>
			</Text>
		</Section>
	);
}
