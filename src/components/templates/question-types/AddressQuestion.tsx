"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressQuestionProps {
	questionId: string;
	value: {
		street?: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
	} | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	disabled?: boolean;
}

export function AddressQuestion({ questionId, value, onChange, required, disabled }: AddressQuestionProps) {
	const address = value ?? {};

	const updateField = (field: string, fieldValue: string) => {
		if (disabled) return;
		onChange(questionId, { ...address, [field]: fieldValue });
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor={`${questionId}-street`}>Street Address</Label>
				<Input
					id={`${questionId}-street`}
					value={address.street ?? ""}
					onChange={(e) => updateField("street", e.target.value)}
					required={required}
					disabled={disabled}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${questionId}-city`}>City</Label>
					<Input
						id={`${questionId}-city`}
						value={address.city ?? ""}
						onChange={(e) => updateField("city", e.target.value)}
						required={required}
						disabled={disabled}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${questionId}-state`}>State/Province</Label>
					<Input
						id={`${questionId}-state`}
						value={address.state ?? ""}
						onChange={(e) => updateField("state", e.target.value)}
						required={required}
						disabled={disabled}
					/>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${questionId}-zip`}>ZIP/Postal Code</Label>
					<Input
						id={`${questionId}-zip`}
						value={address.zip ?? ""}
						onChange={(e) => updateField("zip", e.target.value)}
						required={required}
						disabled={disabled}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${questionId}-country`}>Country</Label>
					<Input
						id={`${questionId}-country`}
						value={address.country ?? ""}
						onChange={(e) => updateField("country", e.target.value)}
						required={required}
						disabled={disabled}
					/>
				</div>
			</div>
		</div>
	);
}

