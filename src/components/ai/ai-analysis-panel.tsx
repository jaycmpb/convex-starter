"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, CircleHelp, FileWarning, Sparkles } from "lucide-react";

interface AiAnalysis {
	summary: string;
	completeness: "complete" | "incomplete" | "unclear";
	missingItems: string[];
	suspiciousItems: string[];
	analyzedAt: number;
	analyzedDocumentIds: string[];
}

interface AiAnalysisPanelProps {
	analysis: AiAnalysis | undefined;
	isLoading?: boolean;
}

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
 * AI Analysis Panel component.
 * Displays AI-generated document intake analysis for staff.
 */
export function AiAnalysisPanel({ analysis, isLoading }: AiAnalysisPanelProps) {
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

				{/* Docs analyzed count */}
				<p className="text-xs text-muted-foreground">
					Based on {analysis.analyzedDocumentIds.length} document{analysis.analyzedDocumentIds.length !== 1 ? "s" : ""}
				</p>
			</CardContent>
		</Card>
	);
}

