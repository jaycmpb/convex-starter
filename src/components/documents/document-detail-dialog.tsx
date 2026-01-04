"use client";

import { DocumentPreview } from "./document-preview";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface DocumentDetailDialogProps {
	documentId: Id<"documents"> | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component showing document preview and metadata.
 * Displays document preview, metadata, associated task info, and download option.
 */
export function DocumentDetailDialog({
	documentId,
	open,
	onOpenChange,
}: DocumentDetailDialogProps) {
	const doc = useQuery(
		api.src.documents.queries.getDocumentById,
		documentId ? { id: documentId } : "skip",
	);

	const downloadUrl = useQuery(
		api.src.documents.actions.getDownloadUrl,
		doc ? { storageId: doc.storageId } : "skip",
	);

	const task = useQuery(
		api.src.tasks.queries.getTaskById,
		doc?.taskId ? { id: doc.taskId } : "skip",
	);

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "Unknown size";
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const isCompletedStatus = (status: string) => {
		const completedStatuses = ["done", "completed", "complete", "closed"];
		return completedStatuses.includes(status.toLowerCase());
	};

	if (!doc) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{doc.name}
					</DialogTitle>
					<DialogDescription>
						Uploaded {formatDistanceToNow(new Date(doc._creationTime), { addSuffix: true })}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Document Preview */}
					<div>
						<h3 className="text-sm font-medium mb-2">Preview</h3>
						<DocumentPreview
							storageId={doc.storageId}
							mimeType={doc.mimeType}
							name={doc.name}
							className="min-h-[400px]"
						/>
					</div>

					{/* Document Metadata */}
					<div className="grid grid-cols-2 gap-4 pt-4 border-t">
						<div>
							<p className="text-sm text-muted-foreground">File Size</p>
							<p className="text-sm font-medium">{formatFileSize(doc.size)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">File Type</p>
							<p className="text-sm font-medium">{doc.mimeType || "Unknown"}</p>
						</div>
					</div>

					{/* Task Reference */}
					{task && (
						<div className="pt-4 border-t">
							<p className="text-sm text-muted-foreground mb-2">Associated Task</p>
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium">{task.name}</p>
								<Badge variant={isCompletedStatus(task.status) ? "secondary" : "outline"}>
									{task.status}
								</Badge>
							</div>
						</div>
					)}

					{/* Download Button */}
					<div className="flex justify-end pt-4 border-t">
						<Button
							onClick={() => {
								if (downloadUrl) {
									const link = window.document.createElement("a");
									link.href = downloadUrl;
									link.download = doc.name;
									link.click();
								}
							}}
							disabled={!downloadUrl}
						>
							<Download className="h-4 w-4 mr-2" />
							Download
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

