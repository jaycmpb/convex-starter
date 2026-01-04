"use client";

import { useCallback, useState } from "react";
import { Upload, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
	onFileSelect: (file: File) => void;
	accept?: string;
	className?: string;
}

export function FileDropzone({ onFileSelect, accept, className }: FileDropzoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);

			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) {
				const file = files[0];
				setSelectedFile(file);
				onFileSelect(file);
			}
		},
		[onFileSelect],
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				const file = files[0];
				setSelectedFile(file);
				onFileSelect(file);
			}
		},
		[onFileSelect],
	);

	const handleRemove = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setSelectedFile(null);
	}, []);

	return (
		<div
			className={cn(
				"relative border-2 border-dashed rounded-lg p-8 transition-colors",
				isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
				className,
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<input
				type="file"
				id="file-upload"
				className="hidden"
				accept={accept}
				onChange={handleFileInput}
			/>
			{selectedFile ? (
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
						<FileIcon className="h-6 w-6 text-muted-foreground" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="font-medium truncate">{selectedFile.name}</p>
						<p className="text-sm text-muted-foreground">
							{(selectedFile.size / 1024).toFixed(1)} KB
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={handleRemove}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-4 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Upload className="h-8 w-8 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium mb-1">Drop your file here</p>
						<p className="text-sm text-muted-foreground mb-4">
							or click to browse
						</p>
						<Button
							type="button"
							variant="outline"
							onClick={() => document.getElementById("file-upload")?.click()}
						>
							Select File
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}



