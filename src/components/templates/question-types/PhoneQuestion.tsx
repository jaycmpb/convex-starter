"use client";

import { Input } from "@/components/ui/input";

interface PhoneQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function PhoneQuestion({ questionId, value, onChange, required, disabled }: PhoneQuestionProps) {
	return (
		<div className="space-y-2">
			<Input
				type="tel"
				value={value ?? ""}
				onChange={(e) => onChange(questionId, e.target.value)}
				required={required}
				disabled={disabled}
			/>
		</div>
	);
}

