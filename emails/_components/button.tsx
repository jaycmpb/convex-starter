import { Button as ReactEmailButton } from "@react-email/components";

interface ButtonProps {
	/** The URL to navigate to when clicked. */
	href: string;
	/** The button label text. */
	children: React.ReactNode;
}

/**
 * Primary CTA button component for emails.
 */
export function Button({ href, children }: ButtonProps) {
	return (
		<ReactEmailButton href={href} className="bg-black text-white text-sm font-semibold px-8 py-3 rounded-lg no-underline inline-block">
			{children}
		</ReactEmailButton>
	);
}
