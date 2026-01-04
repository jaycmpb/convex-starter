"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { CheckCircle2, Circle, Loader2, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ShortTextQuestion } from "./question-types/ShortTextQuestion";
import { LongTextQuestion } from "./question-types/LongTextQuestion";
import { SingleChoiceQuestion } from "./question-types/SingleChoiceQuestion";
import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { DateQuestion } from "./question-types/DateQuestion";
import { ConsentQuestion } from "./question-types/ConsentQuestion";
import { EmailQuestion } from "./question-types/EmailQuestion";
import { PhoneQuestion } from "./question-types/PhoneQuestion";
import { NumberQuestion } from "./question-types/NumberQuestion";
import { FileUploadQuestion } from "./question-types/FileUploadQuestion";
import { SignatureQuestion } from "./question-types/SignatureQuestion";
import { RatingQuestion } from "./question-types/RatingQuestion";
import { AddressQuestion } from "./question-types/AddressQuestion";

interface Section {
	id: string;
	title: string;
	description?: string;
}

interface Question {
	id: string;
	type: string;
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
		operator: string;
		value: string;
	};
}

interface QuestionnairePageProps {
	taskId: Id<"tasks">;
	isStaff?: boolean;
}

export function QuestionnairePage({ taskId, isStaff = false }: QuestionnairePageProps) {
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
	const [activeSection, setActiveSection] = useState<string>("all");

	const template = useQuery(api.src.templates.queries.getTemplateForTask, { taskId });
	const response = useQuery(api.src.templateResponses.queries.getResponseForTask, { taskId });
	const progress = useQuery(api.src.templateResponses.queries.getResponseProgress, { taskId });

	const saveAnswer = useMutation(api.src.templateResponses.mutations.saveAnswer);
	const saveProgress = useMutation(api.src.templateResponses.mutations.saveProgress);
	const submitResponse = useMutation(api.src.templateResponses.mutations.submitResponse);

	// Determine if editing is allowed.
	const isTaskComplete = progress?.taskStatus === "Complete";
	const isReadOnly = isStaff || isTaskComplete;

	// Initialize from saved response.
	useEffect(() => {
		if (response) {
			const savedAnswers: Record<string, any> = {};
			response.answers.forEach((answer) => {
				savedAnswers[answer.questionId] = answer.value;
			});
			setAnswers(savedAnswers);
		}
	}, [response]);

	// Check if a question should be shown based on conditions.
	const shouldShowQuestion = useCallback(
		(question: Question): boolean => {
			if (!question.condition || !template) return true;

			const conditionQuestion = template.questions.find((q: Question) => q.id === question.condition!.questionId);
			if (!conditionQuestion) return true;

			const answer = answers[conditionQuestion.id];
			if (answer === undefined || answer === null || answer === "") return false;

			const condition = question.condition!;
			const answerStr = String(answer).toLowerCase();
			const valueStr = condition.value.toLowerCase();

			switch (condition.operator) {
				case "equals":
					return answerStr === valueStr;
				case "not_equals":
					return answerStr !== valueStr;
				case "contains":
					return answerStr.includes(valueStr);
				default:
					return true;
			}
		},
		[template, answers],
	);

	// Auto-save on answer change.
	const handleAnswerChange = useCallback(
		async (questionId: string, value: any) => {
			if (isReadOnly) return;

			const newAnswers = { ...answers, [questionId]: value };
			setAnswers(newAnswers);

			if (autoSaveTimeout) {
				clearTimeout(autoSaveTimeout);
			}

			const timeout = setTimeout(async () => {
				setIsSaving(true);
				try {
					await saveAnswer({ taskId, questionId, value });
				} catch (error) {
					console.error("Failed to auto-save answer:", error);
				} finally {
					setIsSaving(false);
				}
			}, 1000);

			setAutoSaveTimeout(timeout);
		},
		[answers, autoSaveTimeout, isReadOnly, saveAnswer, taskId],
	);

	const handleManualSave = async () => {
		setIsSaving(true);
		try {
			await saveProgress({ taskId });
		} catch (error) {
			console.error("Failed to save progress:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSubmit = async () => {
		setIsSaving(true);
		try {
			await submitResponse({ taskId });
		} catch (error) {
			console.error("Failed to submit response:", error);
			alert("Failed to submit. Please ensure all required questions are answered.");
		} finally {
			setIsSaving(false);
		}
	};

	if (!template) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	const sections: Section[] = (template.sections as Section[]) || [];
	const questions: Question[] = template.questions as Question[];

	// Group questions by section.
	const unsectionedQuestions = questions.filter((q) => !q.sectionId && shouldShowQuestion(q));
	const questionsBySection = sections.map((section) => ({
		section,
		questions: questions.filter((q) => q.sectionId === section.id && shouldShowQuestion(q)),
	}));

	// Calculate progress per section.
	const getSectionProgress = (sectionQuestions: Question[]) => {
		if (sectionQuestions.length === 0) return 100;
		const answered = sectionQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
		return Math.round((answered / sectionQuestions.length) * 100);
	};

	const totalVisibleQuestions = unsectionedQuestions.length + questionsBySection.reduce((sum, s) => sum + s.questions.length, 0);
	const answeredCount = questions.filter((q) => shouldShowQuestion(q) && answers[q.id] !== undefined && answers[q.id] !== "").length;
	const overallProgress = totalVisibleQuestions > 0 ? Math.round((answeredCount / totalVisibleQuestions) * 100) : 0;

	// Check if all required questions are answered.
	const allRequiredAnswered = questions
		.filter((q) => q.required && shouldShowQuestion(q))
		.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");

	// Completed state.
	if (isTaskComplete && !isStaff) {
		return (
			<div className="max-w-3xl mx-auto py-12">
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
						<h2 className="text-2xl font-semibold mb-2">Questionnaire Completed</h2>
						<p className="text-muted-foreground mb-6">Thank you for completing this questionnaire.</p>
						<Button asChild variant="outline">
							<Link href="/dashboard/work-items">
								<ChevronLeft className="h-4 w-4 mr-2" />
								Back to Work Items
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex gap-6 min-h-[calc(100vh-8rem)]">
			{/* Sidebar navigation */}
			{sections.length > 0 && (
				<aside className="w-64 shrink-0 hidden lg:block">
					<div className="sticky top-6">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Sections</CardTitle>
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<Progress value={overallProgress} className="h-1.5 flex-1" />
									<span>{overallProgress}%</span>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<ScrollArea className="h-[calc(100vh-16rem)]">
									<nav className="space-y-1">
										<button
											onClick={() => setActiveSection("all")}
											className={cn(
												"w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
												activeSection === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
											)}
										>
											<Circle className="h-3 w-3" />
											<span className="flex-1 truncate">All Questions</span>
										</button>

										{unsectionedQuestions.length > 0 && (
											<button
												onClick={() => setActiveSection("unsectioned")}
												className={cn(
													"w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
													activeSection === "unsectioned" ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
												)}
											>
												{getSectionProgress(unsectionedQuestions) === 100 ? (
													<CheckCircle2 className="h-3 w-3 text-green-600" />
												) : (
													<Circle className="h-3 w-3" />
												)}
												<span className="flex-1 truncate">General</span>
												<span className="text-xs text-muted-foreground">{getSectionProgress(unsectionedQuestions)}%</span>
											</button>
										)}

										{questionsBySection.map(({ section, questions: sectionQuestions }) => (
											<button
												key={section.id}
												onClick={() => setActiveSection(section.id)}
												className={cn(
													"w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
													activeSection === section.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
												)}
											>
												{getSectionProgress(sectionQuestions) === 100 ? (
													<CheckCircle2 className="h-3 w-3 text-green-600" />
												) : (
													<Circle className="h-3 w-3" />
												)}
												<span className="flex-1 truncate">{section.title}</span>
												<span className="text-xs text-muted-foreground">{getSectionProgress(sectionQuestions)}%</span>
											</button>
										))}
									</nav>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>
				</aside>
			)}

			{/* Main content */}
			<main className="flex-1 min-w-0">
				<div className="max-w-3xl mx-auto space-y-6">
					{/* Header */}
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-2xl font-semibold">{isReadOnly ? `View: ${template.name}` : template.name}</h1>
							{template.description && <p className="text-muted-foreground mt-1">{template.description}</p>}
						</div>
						<Button asChild variant="ghost" size="sm">
							<Link href="/dashboard/work-items">
								<ChevronLeft className="h-4 w-4 mr-1" />
								Back
							</Link>
						</Button>
					</div>

					{/* Mobile section selector */}
					{sections.length > 0 && (
						<div className="lg:hidden">
							<Card>
								<CardContent className="py-3">
									<div className="flex items-center gap-2 text-sm">
										<Progress value={overallProgress} className="h-2 flex-1" />
										<span className="text-muted-foreground">{overallProgress}%</span>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Questions */}
					<div className="space-y-6">
						{/* Unsectioned questions */}
						{(activeSection === "all" || activeSection === "unsectioned") && unsectionedQuestions.length > 0 && (
							<Card>
								{sections.length > 0 && (
									<CardHeader>
										<CardTitle>General Questions</CardTitle>
									</CardHeader>
								)}
								<CardContent className={sections.length === 0 ? "pt-6" : ""}>
									<div className="space-y-8">
										{unsectionedQuestions.map((question, idx) => (
											<QuestionRenderer
												key={question.id}
												question={question}
												index={idx}
												value={answers[question.id]}
												onChange={handleAnswerChange}
												disabled={isReadOnly}
											/>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Sectioned questions */}
						{questionsBySection.map(({ section, questions: sectionQuestions }) => {
							if (activeSection !== "all" && activeSection !== section.id) return null;
							if (sectionQuestions.length === 0) return null;

							return (
								<Card key={section.id} id={`section-${section.id}`}>
									<CardHeader>
										<CardTitle>{section.title}</CardTitle>
										{section.description && <CardDescription>{section.description}</CardDescription>}
									</CardHeader>
									<CardContent>
										<div className="space-y-8">
											{sectionQuestions.map((question, idx) => (
												<QuestionRenderer
													key={question.id}
													question={question}
													index={idx}
													value={answers[question.id]}
													onChange={handleAnswerChange}
													disabled={isReadOnly}
												/>
											))}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>

					{/* Footer actions */}
					<Card className="sticky bottom-4">
						<CardContent className="py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									{isSaving && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Loader2 className="h-4 w-4 animate-spin" />
											Saving...
										</div>
									)}
									{!isSaving && progress?.lastSavedAt && (
										<span className="text-xs text-muted-foreground">
											Last saved: {new Date(progress.lastSavedAt).toLocaleTimeString()}
										</span>
									)}
								</div>

								{!isReadOnly && (
									<div className="flex items-center gap-2">
										<Button variant="outline" onClick={handleManualSave} disabled={isSaving}>
											<Save className="h-4 w-4 mr-2" />
											Save Progress
										</Button>
										<Button onClick={handleSubmit} disabled={isSaving || !allRequiredAnswered}>
											{isSaving ? (
												<>
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Submitting...
												</>
											) : (
												"Submit"
											)}
										</Button>
									</div>
								)}

								{isReadOnly && (
									<Button asChild variant="outline">
										<Link href="/dashboard/work-items">Close</Link>
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

interface QuestionRendererProps {
	question: Question;
	index: number;
	value: any;
	onChange: (questionId: string, value: any) => void;
	disabled?: boolean;
}

function QuestionRenderer({ question, index, value, onChange, disabled }: QuestionRendererProps) {
	const props = {
		questionId: question.id,
		value: value ?? null,
		onChange: disabled ? () => {} : onChange,
		required: question.required,
		validations: question.validations,
		disabled,
	};

	return (
		<div className="space-y-3">
			<div>
				<h3 className="font-medium">
					{question.title}
					{question.required && <span className="text-destructive ml-1">*</span>}
				</h3>
				{question.description && <p className="text-sm text-muted-foreground mt-1">{question.description}</p>}
			</div>

			<div className="pl-0">
				{question.type === "short_text" && <ShortTextQuestion {...props} />}
				{question.type === "long_text" && <LongTextQuestion {...props} />}
				{question.type === "email" && <EmailQuestion {...props} />}
				{question.type === "phone" && <PhoneQuestion {...props} />}
				{question.type === "number" && <NumberQuestion {...props} min={question.validations?.min} max={question.validations?.max} />}
				{question.type === "date" && <DateQuestion {...props} />}
				{question.type === "single_choice" && <SingleChoiceQuestion {...props} options={question.options || []} />}
				{question.type === "multiple_choice" && <MultipleChoiceQuestion {...props} options={question.options || []} />}
				{question.type === "dropdown" && <DropdownQuestion {...props} options={question.options || []} />}
				{question.type === "consent" && <ConsentQuestion {...props} />}
				{question.type === "file_upload" && <FileUploadQuestion {...props} />}
				{question.type === "signature" && <SignatureQuestion {...props} />}
				{question.type === "rating" && <RatingQuestion {...props} max={question.validations?.max || 5} />}
				{question.type === "address" && <AddressQuestion {...props} />}
			</div>
		</div>
	);
}

