import type { FooterProps } from "@emails/_components/footer";
import { Footer } from "@emails/_components/footer";
import { Header } from "@emails/_components/header";
import { Body, Container, Head, Html, Preview, Section, Tailwind } from "@react-email/components";

interface EmailLayoutProps {
	/** Preview text shown in email clients. */
	preview: string;
	/** The content of the email. */
	children: React.ReactNode;
	/** Optional header title override. */
	headerTitle?: string;
	/** Optional footer props override. */
	footerProps?: FooterProps;
}

/**
 * Base email layout wrapper with header, footer, and Tailwind support.
 */
export function EmailLayout({ preview, children, headerTitle, footerProps }: EmailLayoutProps) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Tailwind>
				<Body style={{ margin: 0, padding: 0, backgroundColor: "#f9fafb", fontFamily: "sans-serif" }}>
					<Section style={{ padding: "48px 16px" }}>
						<Container
							style={{
								maxWidth: 600,
								width: "100%",
								margin: "0 auto",
								backgroundColor: "#ffffff",
								borderRadius: "8px",
								border: "1px solid #e5e7eb",
								overflow: "hidden",
							}}
						>
							<Header title={headerTitle} />
							{children}
							<Footer {...footerProps} />
						</Container>
					</Section>
				</Body>
			</Tailwind>
		</Html>
	);
}
