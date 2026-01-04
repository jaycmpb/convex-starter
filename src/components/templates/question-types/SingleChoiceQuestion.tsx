"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SingleChoiceQuestionProps {
	questionId: string;
	value: string | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	options: string[];
	disabled?: boolean;
}

export function SingleChoiceQuestion({ questionId, value, onChange, required, options, disabled }: SingleChoiceQuestionProps) {
	return (
		<div className="space-y-2">
			<RadioGroup value={value ?? ""} onValueChange={(val) => onChange(questionId, val)} required={required} disabled={disabled}>
				{options.map((option, index) => (
					<div key={index} className="flex items-center space-x-2">
						<RadioGroupItem value={option} id={`${questionId}-${index}`} disabled={disabled} />
						<Label htmlFor={`${questionId}-${index}`} className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
							{option}
						</Label>
					</div>
				))}
			</RadioGroup>
		</div>
	);
}

