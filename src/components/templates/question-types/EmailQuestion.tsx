"use client";

import { Input } from "@/components/ui/input";

interface EmailQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function EmailQuestion({ questionId, value, onChange, required, disabled }: EmailQuestionProps) {
	return (
		<div className="space-y-2">
			<Input
				type="email"
				value={value ?? ""}
				onChange={(e) => onChange(questionId, e.target.value)}
				required={required}
				disabled={disabled}
			/>
		</div>
	);
}

