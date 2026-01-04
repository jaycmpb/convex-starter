"use client";

import { Textarea } from "@/components/ui/textarea";

interface LongTextQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	validations?: {
		minLength?: number;
		maxLength?: number;
	};
	disabled?: boolean;
}

export function LongTextQuestion({ questionId, value, onChange, required, validations, disabled }: LongTextQuestionProps) {
	return (
		<div className="space-y-2">
			<Textarea
				value={value ?? ""}
				onChange={(e) => onChange(questionId, e.target.value)}
				required={required}
				minLength={validations?.minLength}
				maxLength={validations?.maxLength}
				rows={5}
				disabled={disabled}
			/>
		</div>
	);
}

