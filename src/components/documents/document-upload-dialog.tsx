"use client";

import { useState, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";
import { DocumentPreview } from "./document-preview";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { useAccount } from "@/components/providers/account-provider";
import { Loader2 } from "lucide-react";

interface DocumentUploadDialogProps {
	taskId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DocumentUploadDialog({
	taskId,
	open,
	onOpenChange,
}: DocumentUploadDialogProps) {
	const { selectedAccountId } = useAccount();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const taskWithDocument = useQuery(
		api.src.tasks.queries.getTaskWithDocument,
		open ? { id: taskId as Id<"tasks"> } : "skip",
	);

	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const currentUserId = userData?.user?._id;
	const isStaff = userData?.user?.isStaff ?? false;

	// Fetch AI analysis for staff users.
	const aiAnalysis = useQuery(
		api.src.tasks.queries.getTaskAiAnalysis,
		open && isStaff ? { id: taskId as Id<"tasks"> } : "skip",
	);

	const generateUploadUrl = useAction(api.src.documents.actions.generateUploadUrl);
	const createDocument = useMutation(api.src.documents.mutations.createDocument);
	const replaceDocumentFile = useMutation(api.src.documents.mutations.replaceDocumentFile);
	const deleteStorageFile = useAction(api.src.documents.actions.deleteStorageFile);
	const updateTaskStatus = useAction(api.src.tasks.actions.updateTaskStatusWithMondaySync);

	const handleFileSelect = useCallback((file: File) => {
		setSelectedFile(file);
	}, []);

	const handleUpload = useCallback(async () => {
		if (!selectedFile || !currentUserId || !selectedAccountId || !taskWithDocument) {
			return;
		}

		setIsUploading(true);
		try {
			// Generate upload URL
			const uploadUrl = await generateUploadUrl();

			// Upload file to Convex storage
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": selectedFile.type },
				body: selectedFile,
			});

			if (!response.ok) {
				throw new Error("Failed to upload file");
			}

			// Get the storage ID from the upload response
			const { storageId } = await response.json();

			// Create or replace document record
			if (taskWithDocument.document) {
				// Store old storage ID before replacing
				const oldStorageId = taskWithDocument.document.storageId;
				
				// Replace existing document
				await replaceDocumentFile({
					id: taskWithDocument.document._id,
					storageId: storageId as any,
					name: selectedFile.name,
					mimeType: selectedFile.type,
					size: selectedFile.size,
				});

				// Delete old storage file
				try {
					await deleteStorageFile({ storageId: oldStorageId as any });
				} catch (e) {
					console.warn("Failed to delete old storage file:", e);
				}
			} else {
				// Create new document
				await createDocument({
					storageId: storageId as any,
					name: selectedFile.name,
					uploadedBy: currentUserId,
					taskId: taskId as any,
					workItemId: taskWithDocument.workItemId,
					accountId: selectedAccountId,
					mimeType: selectedFile.type,
					size: selectedFile.size,
				});
			}

			// Update task status to "Client Responded" in Convex and Monday.com
			try {
				await updateTaskStatus({
					taskId: taskId as any,
					status: "Client Responded",
				});
			} catch (e) {
				console.warn("Failed to update task status:", e);
				// Don't fail the upload if status update fails
			}

			// Reset and close
			setSelectedFile(null);
			onOpenChange(false);
		} catch (error) {
			console.error("Error uploading document:", error);
			alert("Failed to upload document. Please try again.");
		} finally {
			setIsUploading(false);
		}
	}, [
		selectedFile,
		currentUserId,
		selectedAccountId,
		taskWithDocument,
		taskId,
		generateUploadUrl,
		createDocument,
		replaceDocumentFile,
		deleteStorageFile,
		updateTaskStatus,
		onOpenChange,
	]);

	const existingDocument = taskWithDocument?.document;
	const hasExistingDocument = !!existingDocument;
	const canUpload = selectedFile !== null && !isUploading;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{taskWithDocument?.name || "Upload Document"}
					</DialogTitle>
					{taskWithDocument?.description && (
						<DialogDescription>{taskWithDocument.description}</DialogDescription>
					)}
				</DialogHeader>

				<div className="space-y-6">
					{hasExistingDocument && existingDocument ? (
						<div className="space-y-4">
							{/* AI Analysis Panel (staff only) */}
							{isStaff && aiAnalysis && (
								<AiAnalysisPanel analysis={aiAnalysis} />
							)}
							<div>
								<h3 className="text-sm font-medium mb-2">Current Document</h3>
								<DocumentPreview
									storageId={existingDocument.storageId}
									mimeType={existingDocument.mimeType}
									name={existingDocument.name}
									className="max-h-[400px] overflow-auto"
								/>
							</div>
							{!isStaff && (
								<div>
									<h3 className="text-sm font-medium mb-2">Replace Document</h3>
									<FileDropzone
										onFileSelect={handleFileSelect}
										className="min-h-[200px]"
									/>
								</div>
							)}
						</div>
					) : (
						!isStaff && (
							<div>
								<h3 className="text-sm font-medium mb-2">Upload Document</h3>
								<FileDropzone
									onFileSelect={handleFileSelect}
									className="min-h-[300px]"
								/>
							</div>
						)
					)}

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isUploading}
						>
							{isStaff ? "Close" : "Cancel"}
						</Button>
						{!isStaff && (
							<Button
								onClick={handleUpload}
								disabled={!canUpload}
							>
								{isUploading ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Uploading...
									</>
								) : hasExistingDocument ? (
									"Replace Document"
								) : (
									"Upload Document"
								)}
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

