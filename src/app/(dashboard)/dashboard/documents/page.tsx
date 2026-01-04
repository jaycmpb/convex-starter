"use client";

import { DocumentDetailDialog } from "@/components/documents/document-detail-dialog";
import { useAccount } from "@/components/providers/account-provider";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Download, Edit, ExternalLink, File, Folder, MoreVertical, Trash2, Upload } from "lucide-react";
import { useState } from "react";

export default function DocumentsPage() {
	const { selectedAccountId } = useAccount();
	const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [documentToDelete, setDocumentToDelete] = useState<Id<"documents"> | null>(null);
	const [documentToRename, setDocumentToRename] = useState<{ id: Id<"documents">; name: string } | null>(null);
	const [newDocumentName, setNewDocumentName] = useState("");

	const folderContents = useQuery(api.src.folders.queries.getFolderContents, selectedAccountId ? { accountId: selectedAccountId, folderId: undefined } : "skip");

	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const isStaff = userData?.user?.isStaff ?? false;

	const deleteDocument = useMutation(api.src.documents.mutations.deleteDocument);
	const renameDocument = useMutation(api.src.documents.mutations.renameDocument);

	if (!selectedAccountId) {
		return (
			<div className="flex h-64 items-center justify-center">
				<p className="text-muted-foreground">Please select an account to view documents.</p>
			</div>
		);
	}

	if (folderContents === undefined) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-64" />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="p-6">
								<Skeleton className="h-12 w-12 rounded-lg mb-4" />
								<Skeleton className="h-4 w-3/4 mb-2" />
								<Skeleton className="h-3 w-1/2" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const { subfolders, documents } = folderContents;

	const handleDocumentClick = (documentId: Id<"documents">) => {
		setSelectedDocumentId(documentId);
		setIsDetailDialogOpen(true);
	};

	const handleDeleteClick = (documentId: Id<"documents">, e: React.MouseEvent) => {
		e.stopPropagation();
		setDocumentToDelete(documentId);
		setIsDeleteDialogOpen(true);
	};

	const handleRenameClick = (documentId: Id<"documents">, currentName: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setDocumentToRename({ id: documentId, name: currentName });
		setNewDocumentName(currentName);
		setIsRenameDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (documentToDelete) {
			try {
				await deleteDocument({ id: documentToDelete });
				setIsDeleteDialogOpen(false);
				setDocumentToDelete(null);
			} catch (error) {
				console.error("Failed to delete document:", error);
			}
		}
	};

	const confirmRename = async () => {
		if (documentToRename && newDocumentName.trim()) {
			try {
				await renameDocument({ id: documentToRename.id, name: newDocumentName.trim() });
				setIsRenameDialogOpen(false);
				setDocumentToRename(null);
				setNewDocumentName("");
			} catch (error) {
				console.error("Failed to rename document:", error);
			}
		}
	};

	return (
		<>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-semibold">Documents</h1>
						<p className="text-muted-foreground mt-1">Manage your files and folders.</p>
					</div>
					{!isStaff && (
						<Button>
							<Upload className="h-4 w-4 mr-2" />
							Upload File
						</Button>
					)}
				</div>

				{/* Folders */}
				{subfolders.length > 0 && (
					<div>
						<h2 className="text-xl font-semibold mb-4">Folders</h2>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{subfolders.map((folder) => (
								<FolderCard key={folder._id} folder={folder} />
							))}
						</div>
					</div>
				)}

				{/* Documents */}
				<div>
					<h2 className="text-xl font-semibold mb-4">{documents.length > 0 ? "Recent Documents" : "Documents"}</h2>
					{documents.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{documents.map((document) => (
								<DocumentCard
									key={document._id}
									document={document}
									onClick={() => handleDocumentClick(document._id)}
									onDelete={(e) => handleDeleteClick(document._id, e)}
									onRename={(e) => handleRenameClick(document._id, document.name, e)}
									isStaff={isStaff}
								/>
							))}
						</div>
					) : (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<File className="h-12 w-12 text-muted-foreground mb-4" />
								<p className="text-muted-foreground mb-2">No documents yet</p>
								{!isStaff && (
									<Button variant="outline" size="sm">
										<Upload className="h-4 w-4 mr-2" />
										Upload your first document
									</Button>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Document Detail Dialog */}
			<DocumentDetailDialog documentId={selectedDocumentId} open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen} />

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Document</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to delete this document? This action cannot be undone.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Rename Dialog */}
			<AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Rename Document</AlertDialogTitle>
						<AlertDialogDescription>Enter a new name for this document.</AlertDialogDescription>
					</AlertDialogHeader>
					<Input
						value={newDocumentName}
						onChange={(e) => setNewDocumentName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								confirmRename();
							}
						}}
						autoFocus
					/>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setNewDocumentName("")}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmRename} disabled={!newDocumentName.trim()}>
							Rename
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function FolderCard({ folder }: { folder: { _id: string; name: string } }) {
	return (
		<Card className="hover:bg-accent/50 transition-colors cursor-pointer">
			<CardContent className="p-6">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Folder className="h-6 w-6" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium truncate">{folder.name}</h3>
						<p className="text-sm text-muted-foreground">Folder</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function DocumentCard({
	document,
	onClick,
	onDelete,
	onRename,
	isStaff,
}: {
	document: {
		_id: string;
		name: string;
		mimeType?: string;
		size?: number;
		_creationTime: number;
		task?: { _id: string; name: string; status: string } | null;
		storageId: Id<"_storage">;
	};
	onClick: () => void;
	onDelete: (e: React.MouseEvent) => void;
	onRename: (e: React.MouseEvent) => void;
	isStaff: boolean;
}) {
	const downloadUrl = useQuery(api.src.documents.actions.getDownloadUrl, {
		storageId: document.storageId,
	});

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "Unknown size";
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const getFileIcon = (mimeType?: string) => {
		if (!mimeType) return <File className="h-6 w-6" />;
		if (mimeType.startsWith("image/")) return <File className="h-6 w-6" />;
		if (mimeType === "application/pdf") return <File className="h-6 w-6" />;
		return <File className="h-6 w-6" />;
	};

	const isCompletedStatus = (status: string) => {
		const completedStatuses = ["done", "completed", "complete", "closed"];
		return completedStatuses.includes(status.toLowerCase());
	};

	const canDelete = !document.task || !isCompletedStatus(document.task.status);

	const handleDownload = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (downloadUrl) {
			const link = globalThis.document.createElement("a");
			link.href = downloadUrl;
			link.download = document.name;
			link.click();
		}
	};

	const handleCardClick = (e: React.MouseEvent) => {
		// Only open in new tab if downloadUrl is available, otherwise fall back to dialog
		if (downloadUrl) {
			e.preventDefault();
			window.open(downloadUrl, "_blank", "noopener,noreferrer");
		} else {
			onClick();
		}
	};

	return (
		<Card className="hover:bg-accent/50 transition-colors cursor-pointer relative group" onClick={handleCardClick}>
			{downloadUrl && (
				<div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background">
						<ExternalLink className="h-5 w-5" />
					</div>
				</div>
			)}
			<CardContent className="p-6">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">{getFileIcon(document.mimeType)}</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium truncate mb-1">{document.name}</h3>
						<p className="text-sm text-muted-foreground">{formatFileSize(document.size)}</p>
						{document.task && <p className="text-xs text-muted-foreground mt-1">Task: {document.task.name}</p>}
						<p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(document._creationTime), { addSuffix: true })}</p>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
							<DropdownMenuItem onClick={handleDownload} disabled={!downloadUrl}>
								<Download className="h-4 w-4 mr-2" />
								Download
							</DropdownMenuItem>
							{!isStaff && (
								<>
									<DropdownMenuItem onClick={onRename}>
										<Edit className="h-4 w-4 mr-2" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={onDelete} disabled={!canDelete} className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	);
}
