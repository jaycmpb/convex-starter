"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useAction } from "convex/react";
import { AlertCircle, CheckSquare, ChevronDown, Clock } from "lucide-react";
import type React from "react";
import { useState } from "react";

/**
 * Check if a status represents a completed state.
 * Handles various completed status formats: "done", "completed", "complete", "closed".
 */
const isCompletedStatus = (status: string) => {
	const s = status.toLowerCase();
	return s === "done" || s === "completed" || s === "complete" || s === "closed";
};

/**
 * Status colors from Monday.com boards.
 * Work item status colors (from Personal Tax Returns board).
 */
const WORK_ITEM_STATUS_COLORS: Record<string, string> = {
	"Ready for Review": "#fdab3d",
	Complete: "#00c875",
	"Waiting for Client": "#df2f4a",
	Reviewing: "#007eb5",
	"Not Started": "#c4c4c4",
};

/**
 * Task status colors (from Subitems of Personal Tax Returns board).
 */
const TASK_STATUS_COLORS: Record<string, string> = {
	Started: "#fdab3d",
	Complete: "#00c875",
	Open: "#df2f4a",
	"Follow-up": "#007eb5",
	"Client Responded": "#9d50dd",
	"N/A": "#c4c4c4",
};

/**
 * Get badge styling for a status with a specific color.
 * Uses hardcoded colors from Monday.com boards.
 */
const getStatusBadgeStyle = (status: string, colorMap: Record<string, string> = {}): { className: string; style?: React.CSSProperties } => {
	const color = colorMap[status];

	if (color) {
		// Use the color from Monday.com.
		// Determine text color based on brightness of background.
		const hex = color.replace("#", "");
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		const textColor = brightness > 128 ? "#000000" : "#ffffff";

		return {
			className: "border-transparent",
			style: {
				backgroundColor: color,
				color: textColor,
			},
		};
	}

	// Fallback to default colors.
	const s = status.toLowerCase();
	if (isCompletedStatus(status)) {
		// Dark green background with light green/white text (Google Sheets green)
		return { className: "bg-[#137333] text-[#e6f4ea] border-transparent" };
	}
	if (s === "urgent") {
		// Red background with light text
		return { className: "bg-[#ea4335] text-white border-transparent" };
	}
	// Yellow/amber background with darker text (Google Sheets yellow)
	return { className: "bg-[#fbbc04] text-[#78350f] border-transparent" };
};

/**
 * Get status icon based on status value.
 */
const getStatusIcon = (status: string) => {
	const s = status.toLowerCase();
	if (s === "urgent" || s === "pending") {
		return <AlertCircle className="h-4 w-4" />;
	}
	if (isCompletedStatus(status)) {
		return <CheckSquare className="h-4 w-4" />;
	}
	return <Clock className="h-4 w-4" />;
};

type StatusSelectProps = {
	/** Current status value */
	status: string;
	/** Available status options */
	options: string[];
	/** Status color map (status label -> hex color) */
	statusColors: Record<string, string>;
	/** Whether the user is staff (can edit) */
	isStaff: boolean;
	/** Loading state */
	isLoading?: boolean;
	/** Callback when status changes */
	onStatusChange: (newStatus: string) => void | Promise<void>;
	/** Optional className for the badge/select */
	className?: string;
};

/**
 * StatusSelect component that renders as a badge for non-staff users
 * and as an editable Select dropdown for staff users.
 */
export function StatusSelect({ status, options, statusColors, isStaff, isLoading = false, onStatusChange, className }: StatusSelectProps) {
	const [isUpdating, setIsUpdating] = useState(false);

	const handleChange = async (newStatus: string) => {
		if (newStatus === status || isLoading || isUpdating) return;

		setIsUpdating(true);
		try {
			await onStatusChange(newStatus);
		} catch (error) {
			console.error("Failed to update status:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const badgeBaseClass =
		"inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none";
	const currentStatusStyle = getStatusBadgeStyle(status, statusColors);

	if (!isStaff) {
		// Render as read-only badge for non-staff users.
		return (
			<Badge className={cn(badgeBaseClass, currentStatusStyle.className, className)} style={currentStatusStyle.style}>
				{getStatusIcon(status)}
				{status}
			</Badge>
		);
	}

	// Render as editable Select for staff users.
	// Use a custom trigger that looks exactly like a Badge (no chevron visible).
	return (
		<Select value={status} onValueChange={handleChange} disabled={isLoading || isUpdating}>
			<SelectPrimitive.Trigger
				className={cn(
					badgeBaseClass,
					currentStatusStyle.className,
					"hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer",
					"focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
					"data-[state=open]:opacity-90",
					"[&>svg:last-child]:hidden", // Hide the chevron icon
					className,
				)}
				style={currentStatusStyle.style}
			>
				<SelectPrimitive.Value>
					<span className="flex items-center gap-1">
						{getStatusIcon(status)}
						{status}
					</span>
				</SelectPrimitive.Value>
				<SelectPrimitive.Icon asChild>
					<ChevronDown className="hidden" />
				</SelectPrimitive.Icon>
			</SelectPrimitive.Trigger>
			<SelectContent className="min-w-[180px]">
				{options.map((option) => {
					const optionStyle = getStatusBadgeStyle(option, statusColors);
					return (
						<SelectItem key={option} value={option} className="cursor-pointer focus:bg-accent p-1.5">
							<Badge className={cn(badgeBaseClass, optionStyle.className, "border-0")} style={optionStyle.style}>
								{getStatusIcon(option)}
								{option}
							</Badge>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}

type WorkItemStatusSelectProps = {
	workItemId: Id<"workItems">;
	status: string;
	isStaff: boolean;
	statusOptions?: string[];
};

/**
 * WorkItemStatusSelect component that handles work item status updates with Monday.com sync.
 */
export function WorkItemStatusSelect({ workItemId, status, isStaff, statusOptions = [] }: WorkItemStatusSelectProps) {
	const updateWorkItemStatus = useAction(api.src.workItems.actions.updateWorkItemStatusWithMondaySync);

	const handleStatusChange = async (newStatus: string) => {
		const result = await updateWorkItemStatus({
			workItemId,
			status: newStatus,
		});

		if (!result.success) {
			throw new Error(result.error ?? "Failed to update work item status");
		}
	};

	return <StatusSelect status={status} options={statusOptions} statusColors={WORK_ITEM_STATUS_COLORS} isStaff={isStaff} onStatusChange={handleStatusChange} />;
}

type TaskStatusSelectProps = {
	taskId: Id<"tasks">;
	status: string;
	isStaff: boolean;
	statusOptions?: string[];
};

/**
 * TaskStatusSelect component that handles task status updates with Monday.com sync.
 */
export function TaskStatusSelect({ taskId, status, isStaff, statusOptions = [] }: TaskStatusSelectProps) {
	const updateTaskStatus = useAction(api.src.tasks.actions.updateTaskStatusWithMondaySync);

	const handleStatusChange = async (newStatus: string) => {
		const result = await updateTaskStatus({
			taskId,
			status: newStatus,
		});

		if (!result.success) {
			throw new Error(result.error ?? "Failed to update task status");
		}
	};

	return <StatusSelect status={status} options={statusOptions} statusColors={TASK_STATUS_COLORS} isStaff={isStaff} onStatusChange={handleStatusChange} />;
}
