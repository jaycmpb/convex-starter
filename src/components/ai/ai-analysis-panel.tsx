"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, CircleHelp, FileWarning, Sparkles, Loader2 } from "lucide-react";

interface RecommendedAction {
	type: "request_missing_files" | "mark_complete";
	label: string;
	data?: {
		missingItems?: string[];
	};
}

interface AiAnalysis {
	summary: string;
	completeness: "complete" | "incomplete" | "unclear";
	missingItems: string[];
	suspiciousItems: string[];
	analyzedAt: number;
	analyzedDocumentIds: string[];
	recommendedActions?: RecommendedAction[];
}

interface AiAnalysisPanelProps {
	taskId: Id<"tasks">;
	analysis: AiAnalysis | undefined;
	/** Current document IDs attached to the task. Used to detect stale analysis. */
	currentDocumentIds?: string[];
	isLoading?: boolean;
	/** True when AI analysis is currently running on the server. */
	isAnalysisPending?: boolean;
	/** Current task status. Used to filter out already-completed actions. */
	taskStatus?: string;
}

/**
 * Check if a status represents a completed state.
 */
const isCompletedStatus = (status: string) => {
	const s = status.toLowerCase();
	return s === "done" || s === "completed" || s === "complete" || s === "closed";
};

/**
 * Get the completeness badge styling and icon.
 */
function getCompletenessBadge(completeness: AiAnalysis["completeness"]) {
	switch (completeness) {
		case "complete":
			return {
				icon: <CheckCircle2 className="h-3.5 w-3.5" />,
				label: "Complete",
				className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
			};
		case "incomplete":
			return {
				icon: <AlertTriangle className="h-3.5 w-3.5" />,
				label: "Incomplete",
				className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
			};
		case "unclear":
			return {
				icon: <CircleHelp className="h-3.5 w-3.5" />,
				label: "Unclear",
				className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
			};
	}
}

/**
 * Format a timestamp to a relative time string.
 */
function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	return `${days}d ago`;
}

/**
 * Truncate a string if it exceeds the max length.
 */
function truncateText(text: string, maxLength: number = 80): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength)}...`;
}

/**
 * Check if the analysis is pending or stale (documents changed since last analysis).
 */
function isAnalysisPendingOrStale(analysis: AiAnalysis | undefined, currentDocumentIds: string[] | undefined): boolean {
	// No documents = nothing to analyze.
	if (!currentDocumentIds || currentDocumentIds.length === 0) return false;

	// No analysis yet but documents exist = pending.
	if (!analysis) return true;

	const analyzedSet = new Set(analysis.analyzedDocumentIds);
	const currentSet = new Set(currentDocumentIds);

	// If the sets differ, analysis is stale.
	if (analyzedSet.size !== currentSet.size) return true;
	for (const id of currentSet) {
		if (!analyzedSet.has(id)) return true;
	}
	return false;
}


/**
 * AI Analysis Panel component.
 * Displays AI-generated document intake analysis for staff.
 */
export function AiAnalysisPanel({ taskId, analysis, currentDocumentIds, isLoading, isAnalysisPending, taskStatus }: AiAnalysisPanelProps) {
	const executeAction = useAction(api.src.aiWorkflows.actions.executeRecommendedAction);
	const [executingAction, setExecutingAction] = useState<string | null>(null);

	const analysisPending = isAnalysisPending || isAnalysisPendingOrStale(analysis, currentDocumentIds);
	const isTaskComplete = taskStatus ? isCompletedStatus(taskStatus) : false;

	const handleActionClick = async (action: RecommendedAction) => {
		setExecutingAction(action.type);
		try {
			const result = await executeAction({
				taskId,
				actionType: action.type,
				actionData: action.data,
			});

			if (result.success) {
				toast.success("Action completed", {
					description: `${action.label} was executed successfully.`,
				});
			} else {
				toast.error("Action failed", {
					description: result.error || "Failed to execute action.",
				});
			}
		} catch (error) {
			toast.error("Action failed", {
				description: error instanceof Error ? error.message : "An unexpected error occurred.",
			});
		} finally {
			setExecutingAction(null);
		}
	};

	// Show analyzing state when documents exist but analysis hasn't completed/updated yet.
	if (analysisPending) {
		return (
			<Card className="border-dashed border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
						<span className="text-purple-700 dark:text-purple-400">Analyzing documents...</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						AI is reviewing the uploaded documents. This may take a few seconds.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card className="border-dashed border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-purple-500" />
						<Skeleton className="h-4 w-24" />
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</CardContent>
			</Card>
		);
	}

	if (!analysis) {
		return null;
	}

	const badge = getCompletenessBadge(analysis.completeness);
	const hasMissingItems = analysis.missingItems.length > 0;
	const hasSuspiciousItems = analysis.suspiciousItems.length > 0;

	// Filter out actions that are no longer applicable.
	const availableActions = (analysis.recommendedActions ?? []).filter((action) => {
		// Don't show "mark_complete" if the task is already complete.
		if (action.type === "mark_complete" && isTaskComplete) {
			return false;
		}
		return true;
	});
	const hasRecommendedActions = availableActions.length > 0;

	return (
		<Card className="border-dashed border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-sm font-medium">
						<Sparkles className="h-4 w-4 text-purple-500" />
						AI Analysis
					</CardTitle>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className={badge.className}>
							{badge.icon}
							<span className="ml-1">{badge.label}</span>
						</Badge>
						<span className="text-xs text-muted-foreground">{formatRelativeTime(analysis.analyzedAt)}</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Summary */}
				<p className="text-sm text-foreground">{analysis.summary}</p>

				{/* Missing Items */}
				{hasMissingItems && (
					<div className="space-y-1.5">
						<div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
							<AlertTriangle className="h-3.5 w-3.5" />
							Missing Items
						</div>
						<ul className="text-sm text-muted-foreground space-y-1 pl-5">
							{analysis.missingItems.map((item, i) => (
								<li key={i} className="list-disc" title={item.length > 80 ? item : undefined}>
									{truncateText(item)}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Suspicious Items */}
				{hasSuspiciousItems && (
					<div className="space-y-1.5">
						<div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-400">
							<FileWarning className="h-3.5 w-3.5" />
							Needs Review
						</div>
						<ul className="text-sm text-muted-foreground space-y-1 pl-5">
							{analysis.suspiciousItems.map((item, i) => (
								<li key={i} className="list-disc" title={item.length > 80 ? item : undefined}>
									{truncateText(item)}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Recommended Actions */}
				{hasRecommendedActions && (
					<div className="space-y-2 pt-2 border-t">
						<div className="text-xs font-medium text-muted-foreground mb-2">Recommended Actions</div>
						<div className="flex flex-wrap gap-2">
							{availableActions.map((action, i) => {
								const isExecuting = executingAction === action.type;
								const isPrimary = action.type === "request_missing_files";
								return (
									<Button
										key={i}
										variant={isPrimary ? "default" : "outline"}
										size="sm"
										onClick={() => handleActionClick(action)}
										disabled={isExecuting}
										className={action.type === "mark_complete" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
									>
										{isExecuting ? (
											<>
												<Loader2 className="mr-2 h-3 w-3 animate-spin" />
												Executing...
											</>
										) : (
											action.label
										)}
									</Button>
								);
							})}
						</div>
					</div>
				)}

				{/* Docs analyzed count */}
				<p className="text-xs text-muted-foreground">
					Based on {analysis.analyzedDocumentIds.length} document{analysis.analyzedDocumentIds.length !== 1 ? "s" : ""}
				</p>
			</CardContent>
		</Card>
	);
}

