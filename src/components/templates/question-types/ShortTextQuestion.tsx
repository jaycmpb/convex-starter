"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShortTextQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	validations?: {
		minLength?: number;
		maxLength?: number;
		pattern?: string;
	};
	disabled?: boolean;
}

export function ShortTextQuestion({ questionId, value, onChange, required, validations, disabled }: ShortTextQuestionProps) {
	return (
		<div className="space-y-2">
			<Input
				type="text"
				value={value ?? ""}
				onChange={(e) => onChange(questionId, e.target.value)}
				required={required}
				minLength={validations?.minLength}
				maxLength={validations?.maxLength}
				pattern={validations?.pattern}
				disabled={disabled}
			/>
		</div>
	);
}

