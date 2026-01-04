"use client";

import { Input } from "@/components/ui/input";

interface DateQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function DateQuestion({ questionId, value, onChange, required, disabled }: DateQuestionProps) {
	return (
		<div className="space-y-2">
			<Input
				type="date"
				value={value ?? ""}
				onChange={(e) => onChange(questionId, e.target.value)}
				required={required}
				disabled={disabled}
			/>
		</div>
	);
}

