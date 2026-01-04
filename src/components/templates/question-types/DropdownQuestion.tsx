"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DropdownQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	options: string[];
	disabled?: boolean;
}

export function DropdownQuestion({ questionId, value, onChange, required, options, disabled }: DropdownQuestionProps) {
	return (
		<div className="space-y-2">
			<Select value={value ?? ""} onValueChange={(val) => onChange(questionId, val)} required={required} disabled={disabled}>
				<SelectTrigger>
					<SelectValue placeholder="Select an option" />
				</SelectTrigger>
				<SelectContent>
					{options.map((option, index) => (
						<SelectItem key={index} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

