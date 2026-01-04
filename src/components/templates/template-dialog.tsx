"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
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

interface TemplateDialogProps {
	taskId: Id<"tasks"> | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isStaff?: boolean;
}

export function TemplateDialog({ taskId, open, onOpenChange, isStaff = false }: TemplateDialogProps) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

	const template = useQuery(
		api.src.templates.queries.getTemplateForTask,
		open && taskId ? { taskId } : "skip",
	);

	const response = useQuery(
		api.src.templateResponses.queries.getResponseForTask,
		open && taskId ? { taskId } : "skip",
	);

	const progress = useQuery(
		api.src.templateResponses.queries.getResponseProgress,
		open && taskId ? { taskId } : "skip",
	);

	const saveAnswer = useMutation(api.src.templateResponses.mutations.saveAnswer);
	const saveProgress = useMutation(api.src.templateResponses.mutations.saveProgress);
	const submitResponse = useMutation(api.src.templateResponses.mutations.submitResponse);

	// Check if current question should be shown based on conditions.
	const shouldShowQuestion = (question: {
		id: string;
		condition?: { questionId: string; operator: string; value: string };
	}): boolean => {
		if (!question.condition || !template) return true;

		const conditionQuestion = template.questions.find((q) => q.id === question.condition!.questionId);
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
	};

	// Initialize from saved response.
	useEffect(() => {
		if (response && template) {
			const savedAnswers: Record<string, any> = {};
			response.answers.forEach((answer) => {
				savedAnswers[answer.questionId] = answer.value;
			});
			setAnswers(savedAnswers);
			setCurrentQuestionIndex(response.currentQuestionIndex);
		}
	}, [response, template]);

	// Skip to next visible question if current is hidden.
	useEffect(() => {
		if (!template) return;
		const currentQuestion = template.questions[currentQuestionIndex];
		if (!currentQuestion || shouldShowQuestion(currentQuestion)) return;

		// Find next visible question.
		for (let i = currentQuestionIndex + 1; i < template.questions.length; i++) {
			if (shouldShowQuestion(template.questions[i])) {
				setCurrentQuestionIndex(i);
				return;
			}
		}
		// If no next visible question, go to previous.
		for (let i = currentQuestionIndex - 1; i >= 0; i--) {
			if (shouldShowQuestion(template.questions[i])) {
				setCurrentQuestionIndex(i);
				return;
			}
		}
	}, [answers, template, currentQuestionIndex]);

	// Contacts can only edit if task is not "Complete". Staff can never edit (view-only).
	const isTaskComplete = progress?.taskStatus === "Complete";
	const isReadOnly = isStaff || isTaskComplete;

	// Auto-save on answer change.
	const handleAnswerChange = async (questionId: string, value: any) => {
		// Don't allow changes in read-only mode.
		if (isReadOnly) {
			return;
		}

		const newAnswers = { ...answers, [questionId]: value };
		setAnswers(newAnswers);

		// Clear existing timeout.
		if (autoSaveTimeout) {
			clearTimeout(autoSaveTimeout);
		}

		// Set new timeout for auto-save.
		const timeout = setTimeout(async () => {
			if (taskId) {
				setIsSaving(true);
				try {
					await saveAnswer({ taskId, questionId, value });
				} catch (error) {
					console.error("Failed to auto-save answer:", error);
				} finally {
					setIsSaving(false);
				}
			}
		}, 1000); // Auto-save after 1 second of inactivity.

		setAutoSaveTimeout(timeout);
	};

	const handleManualSave = async () => {
		if (!taskId) return;

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
		if (!taskId) return;

		setIsSaving(true);
		try {
			await submitResponse({ taskId });
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to submit response:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleNext = () => {
		if (template && currentQuestionIndex < template.questions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		}
	};

	const handlePrevious = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	if (!template) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Loading Template</DialogTitle>
					</DialogHeader>
					<div className="flex items-center justify-center p-8">
						<Loader2 className="h-8 w-8 animate-spin" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	const currentQuestion = template.questions[currentQuestionIndex];
	const isLastQuestion = currentQuestionIndex === template.questions.length - 1;
	const isFirstQuestion = currentQuestionIndex === 0;
	const progressPercent = progress ? (progress.answeredQuestions / progress.totalQuestions) * 100 : 0;

	// Show completed UI only when task is marked "Complete" (final state).
	if (isTaskComplete && !isStaff) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{template.name}</DialogTitle>
						<DialogDescription>{template.description}</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center justify-center p-8 space-y-4">
						<CheckCircle2 className="h-16 w-16 text-green-600" />
						<h3 className="text-lg font-semibold">Questionnaire Completed</h3>
						<p className="text-sm text-muted-foreground">Thank you for completing this questionnaire.</p>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{isReadOnly ? `View Responses: ${template.name}` : template.name}</DialogTitle>
					<DialogDescription>{template.description}</DialogDescription>
				</DialogHeader>

				{progress && (
					<div className="space-y-2">
						<div className="flex justify-between text-sm text-muted-foreground">
							<span>
								Question {currentQuestionIndex + 1} of {template.questions.length}
							</span>
							<span>{Math.round(progressPercent)}% Complete</span>
						</div>
						<Progress value={progressPercent} />
					</div>
				)}

				<div className="flex-1 overflow-y-auto py-4">
					{currentQuestion && shouldShowQuestion(currentQuestion) && (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold mb-2">{currentQuestion.title}</h3>
								{currentQuestion.description && (
									<p className="text-sm text-muted-foreground mb-4">{currentQuestion.description}</p>
								)}
							</div>

							{renderQuestion(currentQuestion, answers[currentQuestion.id] ?? null, handleAnswerChange, isReadOnly)}
						</div>
					)}
				</div>

				{!isReadOnly && (
					<div className="flex items-center justify-between pt-4 border-t">
						<div className="flex items-center gap-2">
							{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
							<Button variant="outline" size="sm" onClick={handleManualSave} disabled={isSaving}>
								<Save className="h-4 w-4 mr-2" />
								Save Progress
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<Button variant="outline" onClick={handlePrevious} disabled={isFirstQuestion}>
								Previous
							</Button>
							{isLastQuestion ? (
								<Button onClick={handleSubmit} disabled={isSaving}>
									{isSaving ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Submitting...
										</>
									) : (
										"Submit"
									)}
								</Button>
							) : (
								<Button onClick={handleNext}>Next</Button>
							)}
						</div>
					</div>
				)}
				{isReadOnly && (
					<div className="flex items-center justify-end pt-4 border-t">
						<div className="flex items-center gap-2">
							<Button variant="outline" onClick={handlePrevious} disabled={isFirstQuestion}>
								Previous
							</Button>
							<Button onClick={handleNext} disabled={isLastQuestion}>
								Next
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function renderQuestion(
	question: {
		id: string;
		type: string;
		title: string;
		description?: string;
		required: boolean;
		options?: string[];
		validations?: {
			min?: number;
			max?: number;
			pattern?: string;
			minLength?: number;
			maxLength?: number;
		};
	},
	value: any,
	onChange: (questionId: string, value: any) => void,
	disabled?: boolean,
) {
	const props = {
		questionId: question.id,
		value,
		onChange: disabled ? () => {} : onChange,
		required: question.required,
		validations: question.validations,
		disabled,
	};

	switch (question.type) {
		case "short_text":
			return <ShortTextQuestion {...props} />;
		case "long_text":
			return <LongTextQuestion {...props} />;
		case "email":
			return <EmailQuestion {...props} />;
		case "phone":
			return <PhoneQuestion {...props} />;
		case "number":
			return <NumberQuestion {...props} min={question.validations?.min} max={question.validations?.max} />;
		case "date":
			return <DateQuestion {...props} />;
		case "single_choice":
			return <SingleChoiceQuestion {...props} options={question.options || []} />;
		case "multiple_choice":
			return <MultipleChoiceQuestion {...props} options={question.options || []} />;
		case "dropdown":
			return <DropdownQuestion {...props} options={question.options || []} />;
		case "consent":
			return <ConsentQuestion {...props} />;
		case "file_upload":
			return <FileUploadQuestion {...props} />;
		case "signature":
			return <SignatureQuestion {...props} />;
		case "rating":
			return <RatingQuestion {...props} max={question.validations?.max || 5} />;
		case "address":
			return <AddressQuestion {...props} />;
		default:
			return <div className="text-muted-foreground">Unknown question type: {question.type}</div>;
	}
}

