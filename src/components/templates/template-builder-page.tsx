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
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionEditor } from "@/components/templates/question-editor";

// Simple UUID generator (crypto.randomUUID is available in modern browsers).
function generateUUID(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older browsers.
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface TemplateBuilderPageProps {
	templateId?: string;
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

interface Section {
	id: string;
	title: string;
	description?: string;
	collapsed?: boolean;
}

export function TemplateBuilderPage({ templateId }: TemplateBuilderPageProps) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [sections, setSections] = useState<Section[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

	const existingTemplate = useQuery(api.src.templates.queries.getTemplate, templateId ? { id: templateId as any } : "skip");

	const createTemplate = useMutation(api.src.templates.mutations.createTemplate);
	const updateTemplate = useMutation(api.src.templates.mutations.updateTemplate);

	useEffect(() => {
		if (existingTemplate) {
			setName(existingTemplate.name);
			setDescription(existingTemplate.description || "");
			setSections((existingTemplate.sections as Section[]) || []);
			setQuestions((existingTemplate.questions as Question[]) || []);
			// Expand all sections by default when loading existing template.
			const sectionIds = (existingTemplate.sections as Section[])?.map((s) => s.id) || [];
			setExpandedSections(new Set(sectionIds));
		}
	}, [existingTemplate]);

	const handleAddSection = () => {
		const newSection: Section = {
			id: generateUUID(),
			title: "",
			description: "",
		};
		setSections([...sections, newSection]);
		setExpandedSections(new Set([...expandedSections, newSection.id]));
	};

	const handleRemoveSection = (sectionId: string) => {
		setSections(sections.filter((s) => s.id !== sectionId));
		// Remove questions from this section (move them to no section).
		setQuestions(questions.map((q) => (q.sectionId === sectionId ? { ...q, sectionId: undefined } : q)));
		setExpandedSections((prev) => {
			const next = new Set(prev);
			next.delete(sectionId);
			return next;
		});
	};

	const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
		setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
	};

	const handleAddQuestion = (sectionId?: string) => {
		const newQuestion: Question = {
			id: generateUUID(),
			type: "short_text",
			title: "",
			required: false,
			sectionId,
		};
		setQuestions([...questions, newQuestion]);
		if (sectionId) {
			setExpandedSections((prev) => new Set([...prev, sectionId]));
		}
	};

	const handleRemoveQuestion = (questionId: string) => {
		setQuestions(questions.filter((q) => q.id !== questionId));
	};

	const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
		setQuestions(questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)));
	};

	const handleMoveQuestionToSection = (questionId: string, sectionId: string | undefined) => {
		setQuestions(questions.map((q) => (q.id === questionId ? { ...q, sectionId } : q)));
	};

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

	const handleSave = async () => {
		if (!name.trim()) {
			alert("Template name is required.");
			return;
		}

		const validSections = sections.filter((s) => s.title.trim() !== "");
		const validQuestions = questions.filter((q) => q.title.trim() !== "");

		if (validQuestions.length === 0) {
			alert("At least one question is required.");
			return;
		}

		// Ensure questions with sectionId reference valid sections.
		const validSectionIds = new Set(validSections.map((s) => s.id));
		const cleanedQuestions = validQuestions.map((q) => ({
			...q,
			sectionId: q.sectionId && validSectionIds.has(q.sectionId) ? q.sectionId : undefined,
		}));

		try {
			if (templateId) {
				await updateTemplate({
					id: templateId as any,
					name,
					description: description || undefined,
					sections: validSections.length > 0 ? validSections : undefined,
					questions: cleanedQuestions,
				});
			} else {
				await createTemplate({
					name,
					description: description || undefined,
					sections: validSections.length > 0 ? validSections : undefined,
					questions: cleanedQuestions,
				});
			}
			router.push("/dashboard/templates");
		} catch (error) {
			console.error("Failed to save template:", error);
			alert("Failed to save template. Please try again.");
		}
	};

	const questionsWithoutSection = questions.filter((q) => !q.sectionId || !sections.find((s) => s.id === q.sectionId));

	return (
		<div className="container mx-auto py-6 max-w-6xl">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/templates")}>
							<ArrowLeft className="h-4 w-4" />
						</Button>
						<div>
							<h1 className="text-3xl font-semibold">{templateId ? "Edit Template" : "Create Template"}</h1>
							<p className="text-muted-foreground mt-1">Build your questionnaire template with sections and questions.</p>
						</div>
					</div>
					<Button onClick={handleSave}>
						<Save className="h-4 w-4 mr-2" />
						Save Template
					</Button>
				</div>

				{/* Template Info */}
				<Card>
					<CardHeader>
						<CardTitle>Template Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
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
					</CardContent>
				</Card>

				{/* Sections */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label className="text-lg font-semibold">Sections</Label>
						<Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
							<Plus className="h-4 w-4 mr-2" />
							Add Section
						</Button>
					</div>

					{sections.length === 0 && questionsWithoutSection.length === 0 && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<p className="text-muted-foreground mb-4">No sections or questions yet. Add a section or question to get started.</p>
								<div className="flex gap-2">
									<Button variant="outline" onClick={handleAddSection}>
										<Plus className="h-4 w-4 mr-2" />
										Add Section
									</Button>
									<Button variant="outline" onClick={() => handleAddQuestion()}>
										<Plus className="h-4 w-4 mr-2" />
										Add Question
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Section Editors */}
					{sections.map((section, sectionIndex) => {
						const sectionQuestions = questions.filter((q) => q.sectionId === section.id);
						const isExpanded = expandedSections.has(section.id);

						return (
							<Card key={section.id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1 space-y-2">
											<div className="flex items-center gap-2">
												<Collapsible open={isExpanded} onOpenChange={() => toggleSection(section.id)}>
													<CollapsibleTrigger asChild>
														<Button variant="ghost" size="icon" className="h-6 w-6">
															{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
														</Button>
													</CollapsibleTrigger>
												</Collapsible>
												<Input
													value={section.title}
													onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
													placeholder={`Section ${sectionIndex + 1} Title`}
													className="font-semibold"
												/>
											</div>
											<Textarea
												value={section.description || ""}
												onChange={(e) => handleUpdateSection(section.id, { description: e.target.value || undefined })}
												placeholder="Optional section description"
												rows={2}
											/>
										</div>
										<Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSection(section.id)}>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
								<Collapsible open={isExpanded} onOpenChange={() => toggleSection(section.id)}>
									<CollapsibleContent>
										<CardContent className="space-y-4">
											<div className="flex items-center justify-between">
												<Label className="text-sm text-muted-foreground">
													{sectionQuestions.length} question{sectionQuestions.length !== 1 ? "s" : ""} in this section
												</Label>
												<Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion(section.id)}>
													<Plus className="h-4 w-4 mr-2" />
													Add Question
												</Button>
											</div>

											{sectionQuestions.length === 0 ? (
												<div className="text-center py-8 text-muted-foreground text-sm">No questions in this section yet.</div>
											) : (
												<div className="space-y-4">
													{sectionQuestions.map((question, questionIndex) => (
														<QuestionEditor
															key={question.id}
															question={question}
															index={questionIndex}
															allQuestions={questions}
															sections={sections}
															onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
															onRemove={() => handleRemoveQuestion(question.id)}
															onMoveToSection={(sectionId) => handleMoveQuestionToSection(question.id, sectionId)}
														/>
													))}
												</div>
											)}
										</CardContent>
									</CollapsibleContent>
								</Collapsible>
							</Card>
						);
					})}

					{/* Questions without section */}
					{questionsWithoutSection.length > 0 && (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle>Questions (No Section)</CardTitle>
									<Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion()}>
										<Plus className="h-4 w-4 mr-2" />
										Add Question
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{questionsWithoutSection.map((question, questionIndex) => (
									<QuestionEditor
										key={question.id}
										question={question}
										index={questionIndex}
										allQuestions={questions}
										sections={sections}
										onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
										onRemove={() => handleRemoveQuestion(question.id)}
										onMoveToSection={(sectionId) => handleMoveQuestionToSection(question.id, sectionId)}
									/>
								))}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Footer Actions */}
				<div className="flex justify-end gap-2 pt-4 border-t">
					<Button variant="outline" onClick={() => router.push("/dashboard/templates")}>
						Cancel
					</Button>
					<Button onClick={handleSave}>
						<Save className="h-4 w-4 mr-2" />
						{templateId ? "Update Template" : "Create Template"}
					</Button>
				</div>
			</div>
		</div>
	);
}

