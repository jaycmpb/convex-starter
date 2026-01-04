"use client";

import { Input } from "@/components/ui/input";

interface NumberQuestionProps {
	questionId: string;
	value: number | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	min?: number;
	max?: number;
	disabled?: boolean;
}

export function NumberQuestion({ questionId, value, onChange, required, min, max, disabled }: NumberQuestionProps) {
	return (
		<div className="space-y-2">
			<Input
				type="number"
				value={value ?? ""}
				onChange={(e) => {
					const numValue = e.target.value === "" ? null : Number(e.target.value);
					onChange(questionId, numValue);
				}}
				required={required}
				min={min}
				max={max}
				disabled={disabled}
			/>
		</div>
	);
}

