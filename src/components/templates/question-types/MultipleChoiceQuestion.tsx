"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MultipleChoiceQuestionProps {
	questionId: string;
	value: string[] | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	options: string[];
	disabled?: boolean;
}

export function MultipleChoiceQuestion({
	questionId,
	value,
	onChange,
	required,
	options,
	disabled,
}: MultipleChoiceQuestionProps) {
	const selectedValues = value ?? [];

	const handleChange = (option: string, checked: boolean) => {
		if (disabled) return;
		if (checked) {
			onChange(questionId, [...selectedValues, option]);
		} else {
			onChange(questionId, selectedValues.filter((v) => v !== option));
		}
	};

	return (
		<div className="space-y-2">
			{options.map((option, index) => (
				<div key={index} className="flex items-center space-x-2">
					<Checkbox
						id={`${questionId}-${index}`}
						checked={selectedValues.includes(option)}
						onCheckedChange={(checked) => handleChange(option, checked as boolean)}
						disabled={disabled}
					/>
					<Label htmlFor={`${questionId}-${index}`} className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
						{option}
					</Label>
				</div>
			))}
		</div>
	);
}

