"use client";

import { File as FileIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface DocumentPreviewProps {
	storageId: string;
	mimeType?: string;
	name: string;
	className?: string;
}

export function DocumentPreview({
	storageId,
	mimeType,
	name,
	className,
}: DocumentPreviewProps) {
	const downloadUrl = useQuery(api.src.documents.actions.getDownloadUrl, {
		storageId: storageId as any,
	});

	if (downloadUrl === undefined) {
		return (
			<div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
				<div className="text-center">
					<FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
					<p className="text-sm text-muted-foreground">Loading preview...</p>
				</div>
			</div>
		);
	}

	if (downloadUrl === null) {
		return (
			<div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
				<div className="text-center">
					<FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
					<p className="text-sm text-muted-foreground">Unable to load preview</p>
				</div>
			</div>
		);
	}

	const isImage = mimeType?.startsWith("image/");
	const isPdf = mimeType === "application/pdf";

	if (isImage) {
		return (
			<div className={`relative ${className}`}>
				<img
					src={downloadUrl}
					alt={name}
					className="w-full h-auto rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
					onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
				/>
			</div>
		);
	}

	if (isPdf) {
		return (
			<div className={`w-full ${className}`}>
				<iframe
					src={downloadUrl}
					title={name}
					className="w-full h-[600px] rounded-lg border"
				/>
				<div className="mt-2 text-center">
					<a
						href={downloadUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-primary hover:underline"
					>
						Open in new tab
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
			<div className="text-center">
				<FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
				<p className="font-medium mb-1">{name}</p>
				<p className="text-sm text-muted-foreground">
					Preview not available for this file type
				</p>
				<a
					href={downloadUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-primary hover:underline mt-2 inline-block"
				>
					Download file
				</a>
			</div>
		</div>
	);
}

