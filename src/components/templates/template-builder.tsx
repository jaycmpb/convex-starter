"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, ChevronRight, FolderPlus, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

/** Simple UUID generator. */
function generateUUID(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface TemplateBuilderProps {
	templateId?: string;
	onClose: () => void;
}

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

interface Section {
	id: string;
	title: string;
	description?: string;
	collapsed?: boolean;
}

interface Question {
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

export function TemplateBuilder({ templateId, onClose }: TemplateBuilderProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [sections, setSections] = useState<Section[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["unsectioned"]));

	const existingTemplate = useQuery(api.src.templates.queries.getTemplate, templateId ? { id: templateId as any } : "skip");

	const createTemplate = useMutation(api.src.templates.mutations.createTemplate);
	const updateTemplate = useMutation(api.src.templates.mutations.updateTemplate);

	useEffect(() => {
		if (existingTemplate) {
			setName(existingTemplate.name);
			setDescription(existingTemplate.description || "");
			setSections((existingTemplate.sections as Section[]) || []);
			setQuestions(existingTemplate.questions as Question[]);
			// Expand all sections by default when editing.
			const sectionIds = new Set((existingTemplate.sections as Section[])?.map((s) => s.id) || []);
			sectionIds.add("unsectioned");
			setExpandedSections(sectionIds);
		}
	}, [existingTemplate]);

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(sectionId)) {
				next.delete(sectionId);
			} else {
				next.add(sectionId);
			}
			return next;
		});
	};

	const handleAddSection = () => {
		const newSection: Section = {
			id: generateUUID(),
			title: "",
		};
		setSections([...sections, newSection]);
		setExpandedSections((prev) => new Set([...prev, newSection.id]));
	};

	const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
		setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
	};

	const handleRemoveSection = (sectionId: string) => {
		// Move questions from this section to unsectioned.
		setQuestions(questions.map((q) => (q.sectionId === sectionId ? { ...q, sectionId: undefined } : q)));
		setSections(sections.filter((s) => s.id !== sectionId));
	};

	const handleAddQuestion = (sectionId?: string) => {
		setQuestions([
			...questions,
			{
				id: generateUUID(),
				type: "short_text",
				title: "",
				required: false,
				sectionId,
			},
		]);
	};

	const handleRemoveQuestion = (questionId: string) => {
		setQuestions(questions.filter((q) => q.id !== questionId));
	};

	const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
		setQuestions(questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)));
	};

	const handleSave = async () => {
		if (!name.trim()) {
			alert("Template name is required.");
			return;
		}

		const validQuestions = questions.filter((q) => q.title.trim() !== "");
		if (validQuestions.length === 0) {
			alert("At least one question is required.");
			return;
		}

		const validSections = sections.filter((s) => s.title.trim() !== "");

		try {
			if (templateId) {
				await updateTemplate({
					id: templateId as any,
					name,
					description: description || undefined,
					sections: validSections.length > 0 ? validSections : undefined,
					questions: validQuestions,
				});
			} else {
				await createTemplate({
					name,
					description: description || undefined,
					sections: validSections.length > 0 ? validSections : undefined,
					questions: validQuestions,
				});
			}
			onClose();
		} catch (error) {
			console.error("Failed to save template:", error);
			alert("Failed to save template. Please try again.");
		}
	};

	// Group questions by section.
	const unsectionedQuestions = questions.filter((q) => !q.sectionId);
	const questionsBySection = sections.map((section) => ({
		section,
		questions: questions.filter((q) => q.sectionId === section.id),
	}));

	return (
		<div className="space-y-6">
			{/* Template metadata */}
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="template-name">Template Name *</Label>
					<Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tax Information Form" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="template-description">Description</Label>
					<Textarea
						id="template-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Optional description of the template"
						rows={3}
					/>
				</div>
			</div>

			{/* Sections and Questions */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label className="text-lg font-semibold">Sections & Questions</Label>
					<div className="flex gap-2">
						<Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
							<FolderPlus className="h-4 w-4 mr-2" />
							Add Section
						</Button>
						<Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion()}>
							<Plus className="h-4 w-4 mr-2" />
							Add Question
						</Button>
					</div>
				</div>

				{/* Unsectioned questions */}
				{(unsectionedQuestions.length > 0 || sections.length === 0) && (
					<Collapsible open={expandedSections.has("unsectioned")} onOpenChange={() => toggleSection("unsectioned")}>
						<Card>
							<CardHeader className="py-3">
								<CollapsibleTrigger asChild>
									<div className="flex items-center justify-between cursor-pointer">
										<div className="flex items-center gap-2">
											{expandedSections.has("unsectioned") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
											<CardTitle className="text-base">{sections.length > 0 ? "Unsectioned Questions" : "Questions"}</CardTitle>
											<span className="text-sm text-muted-foreground">({unsectionedQuestions.length})</span>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												handleAddQuestion();
											}}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</CollapsibleTrigger>
							</CardHeader>
							<CollapsibleContent>
								<CardContent className="pt-0">
									{unsectionedQuestions.length === 0 ? (
										<p className="text-sm text-muted-foreground text-center py-4">No questions yet. Click + to add a question.</p>
									) : (
										<div className="space-y-4">
											{unsectionedQuestions.map((question) => (
												<QuestionEditor
													key={question.id}
													question={question}
													index={questions.indexOf(question)}
													allQuestions={questions}
													sections={sections}
													onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
													onRemove={() => handleRemoveQuestion(question.id)}
												/>
											))}
										</div>
									)}
								</CardContent>
							</CollapsibleContent>
						</Card>
					</Collapsible>
				)}

				{/* Sectioned questions */}
				{questionsBySection.map(({ section, questions: sectionQuestions }) => (
					<Collapsible key={section.id} open={expandedSections.has(section.id)} onOpenChange={() => toggleSection(section.id)}>
						<Card>
							<CardHeader className="py-3">
								<CollapsibleTrigger asChild>
									<div className="flex items-center justify-between cursor-pointer">
										<div className="flex items-center gap-2 flex-1">
											{expandedSections.has(section.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
											<Input
												value={section.title}
												onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
												onClick={(e) => e.stopPropagation()}
												placeholder="Section title"
												className="font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
											/>
											<span className="text-sm text-muted-foreground">({sectionQuestions.length})</span>
										</div>
										<div className="flex items-center gap-1">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleAddQuestion(section.id);
												}}
											>
												<Plus className="h-4 w-4" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveSection(section.id);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CollapsibleTrigger>
							</CardHeader>
							<CollapsibleContent>
								<CardContent className="pt-0 space-y-4">
									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">Section Description (Optional)</Label>
										<Textarea
											value={section.description || ""}
											onChange={(e) => handleUpdateSection(section.id, { description: e.target.value || undefined })}
											placeholder="Optional section description"
											rows={2}
											className="text-sm"
										/>
									</div>
									{sectionQuestions.length === 0 ? (
										<p className="text-sm text-muted-foreground text-center py-4">No questions in this section. Click + to add a question.</p>
									) : (
										<div className="space-y-4">
											{sectionQuestions.map((question) => (
												<QuestionEditor
													key={question.id}
													question={question}
													index={questions.indexOf(question)}
													allQuestions={questions}
													sections={sections}
													onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
													onRemove={() => handleRemoveQuestion(question.id)}
												/>
											))}
										</div>
									)}
								</CardContent>
							</CollapsibleContent>
						</Card>
					</Collapsible>
				))}
			</div>

			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button onClick={handleSave}>{templateId ? "Update Template" : "Create Template"}</Button>
			</div>
		</div>
	);
}

interface QuestionEditorProps {
	question: Question;
	index: number;
	allQuestions: Question[];
	sections: Section[];
	onUpdate: (updates: Partial<Question>) => void;
	onRemove: () => void;
}

function QuestionEditor({ question, index, allQuestions, sections, onUpdate, onRemove }: QuestionEditorProps) {
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

	const canHaveCondition = index > 0;

	return (
		<Card className="border-dashed">
			<CardContent className="pt-4">
				<div className="space-y-4">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-2">
							<GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
							<span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
						</div>
						<Button type="button" variant="ghost" size="icon" onClick={onRemove}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label className="text-xs">Type</Label>
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
								<SelectTrigger className="h-9">
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
						{sections.length > 0 && (
							<div className="space-y-2">
								<Label className="text-xs">Section</Label>
								<Select value={question.sectionId || "none"} onValueChange={(value) => onUpdate({ sectionId: value === "none" ? undefined : value })}>
									<SelectTrigger className="h-9">
										<SelectValue placeholder="No section" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">No section</SelectItem>
										{sections.map((section) => (
											<SelectItem key={section.id} value={section.id}>
												{section.title || "Untitled section"}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="space-y-2">
							<Label className="text-xs">Required</Label>
							<div className="flex items-center space-x-2 pt-1">
								<Checkbox checked={question.required} onCheckedChange={(checked) => onUpdate({ required: checked as boolean })} />
								<Label className="text-sm">Required</Label>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-xs">Question *</Label>
						<Input value={question.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Enter question text" />
					</div>

					<div className="space-y-2">
						<Label className="text-xs">Description</Label>
						<Textarea
							value={question.description || ""}
							onChange={(e) => onUpdate({ description: e.target.value || undefined })}
							placeholder="Additional context or instructions"
							rows={2}
						/>
					</div>

					{needsOptions && (
						<div className="space-y-2">
							<Label className="text-xs">Options *</Label>
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
								<Button type="button" variant="outline" size="sm" onClick={() => onUpdate({ options: [...(question.options || []), ""] })}>
									<Plus className="h-4 w-4 mr-2" />
									Add Option
								</Button>
							</div>
						</div>
					)}

					{canHaveCondition && (
						<div className="space-y-2">
							<Label className="text-xs">Conditional Logic</Label>
							<div className="grid grid-cols-3 gap-2">
								<Select
									value={question.condition?.questionId || "none"}
									onValueChange={(value) => {
										onUpdate({
											condition:
												value && value !== "none"
													? {
															questionId: value,
															operator: question.condition?.operator || "equals",
															value: question.condition?.value || "",
														}
													: undefined,
										});
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue placeholder="Show if..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Always show</SelectItem>
										{allQuestions.slice(0, index).map((q) => (
											<SelectItem key={q.id} value={q.id}>
												{q.title || `Q${allQuestions.indexOf(q) + 1}`}
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
											<SelectTrigger className="h-9">
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
											className="h-9"
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
