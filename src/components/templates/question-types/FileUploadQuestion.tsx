"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface FileUploadQuestionProps {
	questionId: string;
	value: File[] | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function FileUploadQuestion({ questionId, value, onChange, required, disabled }: FileUploadQuestionProps) {
	const files = value ?? [];

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return;
		const newFiles = Array.from(e.target.files || []);
		onChange(questionId, [...files, ...newFiles]);
	};

	const removeFile = (index: number) => {
		if (disabled) return;
		const newFiles = files.filter((_, i) => i !== index);
		onChange(questionId, newFiles.length > 0 ? newFiles : null);
	};

	return (
		<div className="space-y-2">
			<Input
				type="file"
				id={questionId}
				onChange={handleFileChange}
				required={required && files.length === 0}
				multiple
				className="hidden"
				disabled={disabled}
			/>
			<Label htmlFor={questionId}>
				<Button type="button" variant="outline" asChild disabled={disabled}>
					<span>
						<Upload className="h-4 w-4 mr-2" />
						Upload Files
					</span>
				</Button>
			</Label>
			{files.length > 0 && (
				<div className="space-y-2 mt-4">
					{files.map((file, index) => (
						<div key={index} className="flex items-center justify-between p-2 border rounded">
							<span className="text-sm truncate flex-1">{file.name}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => removeFile(index)}
								className="h-6 w-6"
								disabled={disabled}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

