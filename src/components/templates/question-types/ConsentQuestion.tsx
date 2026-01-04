"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ConsentQuestionProps {
	questionId: string;
	value: boolean | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function ConsentQuestion({ questionId, value, onChange, required, disabled }: ConsentQuestionProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center space-x-2">
				<Checkbox
					id={questionId}
					checked={value ?? false}
					onCheckedChange={(checked) => onChange(questionId, checked)}
					required={required}
					disabled={disabled}
				/>
				<Label htmlFor={questionId} className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
					I consent
				</Label>
			</div>
		</div>
	);
}

