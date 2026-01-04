"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingQuestionProps {
	questionId: string;
	value: number | null;
	onChange: (questionId: string, value: any) => void;
	required?: boolean;
	max?: number;
	disabled?: boolean;
}

export function RatingQuestion({ questionId, value, onChange, required, max = 5, disabled }: RatingQuestionProps) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				{Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
					<Button
						key={rating}
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => onChange(questionId, rating)}
						className="p-0"
						disabled={disabled}
					>
						<Star
							className={`h-8 w-8 ${
								value !== null && rating <= value
									? "fill-yellow-400 text-yellow-400"
									: "text-gray-300"
							}`}
						/>
					</Button>
				))}
			</div>
			{value !== null && <p className="text-sm text-muted-foreground">Rating: {value} / {max}</p>}
		</div>
	);
}

