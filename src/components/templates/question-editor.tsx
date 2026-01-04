"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Plus, Trash2 } from "lucide-react";

type QuestionType =
	| "short_text"
	| "long_text"
	| "email"
	| "phone"
	| "number"
	| "date"
	| "single_choice"
	| "multiple_choice"
	| "dropdown"
	| "consent"
	| "file_upload"
	| "signature"
	| "rating"
	| "address";

export interface Question {
	id: string;
	type: QuestionType;
	title: string;
	description?: string;
	required: boolean;
	sectionId?: string;
	options?: string[];
	validations?: {
		min?: number;
		max?: number;
		pattern?: string;
		minLength?: number;
		maxLength?: number;
	};
	condition?: {
		questionId: string;
		operator: "equals" | "not_equals" | "contains";
		value: string;
	};
}

export interface Section {
	id: string;
	title: string;
	description?: string;
	collapsed?: boolean;
}

interface QuestionEditorProps {
	question: Question;
	index: number;
	allQuestions: Question[];
	sections: Section[];
	onUpdate: (updates: Partial<Question>) => void;
	onRemove: () => void;
	onMoveToSection: (sectionId: string | undefined) => void;
}

export function QuestionEditor({ question, index, allQuestions, sections, onUpdate, onRemove, onMoveToSection }: QuestionEditorProps) {
	const questionTypes: { value: QuestionType; label: string }[] = [
		{ value: "short_text", label: "Short Text" },
		{ value: "long_text", label: "Long Text" },
		{ value: "email", label: "Email" },
		{ value: "phone", label: "Phone" },
		{ value: "number", label: "Number" },
		{ value: "date", label: "Date" },
		{ value: "single_choice", label: "Single Choice" },
		{ value: "multiple_choice", label: "Multiple Choice" },
		{ value: "dropdown", label: "Dropdown" },
		{ value: "consent", label: "Consent" },
		{ value: "file_upload", label: "File Upload" },
		{ value: "signature", label: "Signature" },
		{ value: "rating", label: "Rating" },
		{ value: "address", label: "Address" },
	];

	const needsOptions = question.type === "single_choice" || question.type === "multiple_choice" || question.type === "dropdown";

	// Find the index of this question in the full list for conditional logic.
	const questionIndexInAll = allQuestions.findIndex((q) => q.id === question.id);
	const canHaveCondition = questionIndexInAll > 0; // Can only depend on previous questions.

	// Get questions that come before this one for conditional logic.
	const previousQuestions = allQuestions.slice(0, questionIndexInAll);

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<GripVertical className="h-5 w-5 text-muted-foreground" />
							<span className="text-sm font-medium">Question {index + 1}</span>
						</div>
						<Button type="button" variant="ghost" size="icon" onClick={onRemove}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>

					{/* Section Assignment */}
					{sections.length > 0 && (
						<div className="space-y-2">
							<Label>Section</Label>
							<Select value={question.sectionId || "none"} onValueChange={(value) => onMoveToSection(value === "none" ? undefined : value)}>
								<SelectTrigger>
									<SelectValue placeholder="Select section..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No Section</SelectItem>
									{sections.map((section) => (
										<SelectItem key={section.id} value={section.id}>
											{section.title || `Section ${sections.indexOf(section) + 1}`}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Question Type</Label>
							<Select
								value={question.type}
								onValueChange={(value) => {
									const updates: Partial<Question> = { type: value as QuestionType };
									if (!needsOptions && (value === "single_choice" || value === "multiple_choice" || value === "dropdown")) {
										updates.options = [];
									}
									onUpdate(updates);
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{questionTypes.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Required</Label>
							<div className="flex items-center space-x-2 pt-2">
								<Checkbox checked={question.required} onCheckedChange={(checked) => onUpdate({ required: checked as boolean })} />
								<Label className="text-sm">This question is required</Label>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Question Title *</Label>
						<Input value={question.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Enter question text" />
					</div>

					<div className="space-y-2">
						<Label>Description (Optional)</Label>
						<Textarea
							value={question.description || ""}
							onChange={(e) => onUpdate({ description: e.target.value || undefined })}
							placeholder="Additional context or instructions"
							rows={2}
						/>
					</div>

					{needsOptions && (
						<div className="space-y-2">
							<Label>Options *</Label>
							<div className="space-y-2">
								{(question.options || []).map((option, optIndex) => (
									<div key={optIndex} className="flex gap-2">
										<Input
											value={option}
											onChange={(e) => {
												const newOptions = [...(question.options || [])];
												newOptions[optIndex] = e.target.value;
												onUpdate({ options: newOptions });
											}}
											placeholder={`Option ${optIndex + 1}`}
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => {
												const newOptions = (question.options || []).filter((_, i) => i !== optIndex);
												onUpdate({ options: newOptions });
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										onUpdate({ options: [...(question.options || []), ""] });
									}}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Option
								</Button>
							</div>
						</div>
					)}

					{canHaveCondition && (
						<div className="space-y-2">
							<Label>Conditional Logic (Optional)</Label>
							<div className="grid grid-cols-3 gap-2">
								<Select
									value={question.condition?.questionId || "none"}
									onValueChange={(value) => {
										onUpdate({
											condition: value && value !== "none"
												? {
														questionId: value,
														operator: question.condition?.operator || "equals",
														value: question.condition?.value || "",
													}
												: undefined,
										});
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Show if..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No condition</SelectItem>
										{previousQuestions.map((q) => (
											<SelectItem key={q.id} value={q.id}>
												{q.title || `Question ${allQuestions.indexOf(q) + 1}`}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{question.condition && (
									<>
										<Select
											value={question.condition.operator}
											onValueChange={(value) => {
												onUpdate({
													condition: {
														...question.condition!,
														operator: value as "equals" | "not_equals" | "contains",
													},
												});
											}}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="equals">equals</SelectItem>
												<SelectItem value="not_equals">not equals</SelectItem>
												<SelectItem value="contains">contains</SelectItem>
											</SelectContent>
										</Select>
										<Input
											value={question.condition.value}
											onChange={(e) => {
												onUpdate({
													condition: {
														...question.condition!,
														value: e.target.value,
													},
												});
											}}
											placeholder="Value"
										/>
									</>
								)}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}





