"use client";

import { useAccount } from "@/components/providers/account-provider";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, File, Upload, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DocumentsPage() {
	const { selectedAccountId } = useAccount();
	const folderContents = useQuery(
		api.src.folders.queries.getFolderContents,
		selectedAccountId ? { accountId: selectedAccountId, folderId: undefined } : "skip",
	);

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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Documents</h1>
					<p className="text-muted-foreground mt-1">
						Manage your files and folders.
					</p>
				</div>
				<Button>
					<Upload className="h-4 w-4 mr-2" />
					Upload File
				</Button>
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
				<h2 className="text-xl font-semibold mb-4">
					{documents.length > 0 ? "Recent Documents" : "Documents"}
				</h2>
				{documents.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{documents.map((document) => (
							<DocumentCard key={document._id} document={document} />
						))}
					</div>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<File className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground mb-2">No documents yet</p>
							<Button variant="outline" size="sm">
								<Upload className="h-4 w-4 mr-2" />
								Upload your first document
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
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
}: {
	document: {
		_id: string;
		name: string;
		mimeType?: string;
		size?: number;
		_creationTime: number;
	};
}) {
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

	return (
		<Card className="hover:bg-accent/50 transition-colors cursor-pointer">
			<CardContent className="p-6">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
						{getFileIcon(document.mimeType)}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium truncate mb-1">{document.name}</h3>
						<p className="text-sm text-muted-foreground">
							{formatFileSize(document.size)}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{formatDistanceToNow(new Date(document._creationTime), { addSuffix: true })}
						</p>
					</div>
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

