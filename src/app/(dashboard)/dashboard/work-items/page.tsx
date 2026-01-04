"use client";

import { useAccount } from "@/components/providers/account-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { AlertCircle, CheckSquare, ChevronDown, ChevronRight, Clock, FileText, MessageSquare, ClipboardList, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { ChatDialog } from "@/components/chat/chat-dialog";
import { Button } from "@/components/ui/button";

/**
 * Check if a status represents a completed state.
 * Handles various completed status formats: "done", "completed", "complete", "closed".
 */
const isCompletedStatus = (status: string) => {
	const s = status.toLowerCase();
	return s === "done" || s === "completed" || s === "complete" || s === "closed";
};

/**
 * Get background color class for a work item or task based on its status.
 * Returns subtle semantic colors: green for completed, amber for pending, red for urgent.
 */
const getStatusBackgroundColor = (status: string) => {
	const s = status.toLowerCase();
	if (isCompletedStatus(status)) {
		return "bg-green-50 dark:bg-green-950/30";
	}
	if (s === "urgent") {
		return "bg-red-50 dark:bg-red-950/30";
	}
	return "bg-amber-50 dark:bg-amber-950/30";
};

/**
 * Get Google Spreadsheet-style badge colors for status badges.
 * Returns custom className with appropriate background and text colors.
 */
const getStatusBadgeClassName = (status: string): string => {
	const s = status.toLowerCase();
	if (isCompletedStatus(status)) {
		// Dark green background with light green/white text (Google Sheets green)
		return "bg-[#137333] text-[#e6f4ea] border-transparent";
	}
	if (s === "urgent") {
		// Red background with light text
		return "bg-[#ea4335] text-white border-transparent";
	}
	// Yellow/amber background with darker text (Google Sheets yellow)
	return "bg-[#fbbc04] text-[#78350f] border-transparent";
};

type StatusFilter = "all" | "pending" | "completed";
type TaskTypeFilter = "all" | "document" | "questionnaire" | "chat";

export default function WorkItemsPage() {
	const { selectedAccountId } = useAccount();
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const user = userData?.user;
	const isStaff = user?.isStaff ?? false;

	// Filter state.
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("all");
	const [clientFilter, setClientFilter] = useState<string>("all");

	// For staff, get work items by team assignee; for clients, get by account.
	const staffWorkItems = useQuery(
		api.src.workItems.queries.getWorkItemsByTeamAssignee,
		isStaff && user ? { teamAssigneeId: user._id } : "skip",
	);
	const clientWorkItems = useQuery(
		api.src.workItems.queries.getWorkItemsWithTasks,
		!isStaff && selectedAccountId ? { accountId: selectedAccountId } : "skip",
	);

	const workItemsWithTasks = isStaff ? staffWorkItems : clientWorkItems;

	// Get unique clients for staff filter.
	const uniqueClients = useMemo(() => {
		if (!isStaff || !workItemsWithTasks) return [];
		const clientMap = new Map<string, { id: string; name: string }>();
		workItemsWithTasks.forEach((item) => {
			if (item.account) {
				clientMap.set(item.account._id, { id: item.account._id, name: item.account.name });
			}
		});
		return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
	}, [isStaff, workItemsWithTasks]);

	// Apply filters.
	const filteredWorkItems = useMemo(() => {
		if (!workItemsWithTasks) return [];

		return workItemsWithTasks
			.map((workItem) => {
				// Filter tasks within each work item.
				let filteredTasks = workItem.tasks;

				// Filter by task type.
				if (taskTypeFilter !== "all") {
					filteredTasks = filteredTasks.filter((task) => task.type === taskTypeFilter);
				}

				// Filter by task status.
				if (statusFilter !== "all") {
					filteredTasks = filteredTasks.filter((task) => {
						const isComplete = isCompletedStatus(task.status);
						return statusFilter === "completed" ? isComplete : !isComplete;
					});
				}

				return { ...workItem, tasks: filteredTasks };
			})
			.filter((workItem) => {
				// Filter by search query (work item name).
				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					const nameMatch = workItem.name?.toLowerCase().includes(query);
					const taskMatch = workItem.tasks.some((task) => task.name.toLowerCase().includes(query));
					if (!nameMatch && !taskMatch) return false;
				}

				// Filter by client (staff only).
				if (isStaff && clientFilter !== "all") {
					if (workItem.account?._id !== clientFilter) return false;
				}

				// Filter by work item status.
				if (statusFilter !== "all") {
					const isComplete = isCompletedStatus(workItem.status);
					const statusMatch = statusFilter === "completed" ? isComplete : !isComplete;
					// Show work item if it matches status OR has matching tasks.
					if (!statusMatch && workItem.tasks.length === 0) return false;
				}

				return true;
			});
	}, [workItemsWithTasks, searchQuery, statusFilter, taskTypeFilter, clientFilter, isStaff]);

	const hasActiveFilters = searchQuery || statusFilter !== "all" || taskTypeFilter !== "all" || (isStaff && clientFilter !== "all");

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("all");
		setTaskTypeFilter("all");
		setClientFilter("all");
	};

	if (!isStaff && !selectedAccountId) {
		return (
			<div className="flex h-64 items-center justify-center">
				<p className="text-muted-foreground">Please select an account to view work items.</p>
			</div>
		);
	}

	if (workItemsWithTasks === undefined) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-64" />
				<Card>
					<CardContent className="p-6">
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Stats based on unfiltered data.
	const totalTasks = workItemsWithTasks.reduce((sum, item) => sum + item.tasks.length, 0);
	const pendingTasks = workItemsWithTasks.reduce(
		(sum, item) => sum + item.tasks.filter((task) => !isCompletedStatus(task.status)).length,
		0,
	);
	const completedTasks = workItemsWithTasks.reduce(
		(sum, item) => sum + item.tasks.filter((task) => isCompletedStatus(task.status)).length,
		0,
	);

	// Stats for filtered data.
	const filteredTotalTasks = filteredWorkItems.reduce((sum, item) => sum + item.tasks.length, 0);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Work Items</h1>
				<p className="text-muted-foreground mt-1">
					{isStaff ? "Manage work items assigned to you." : "Manage your work items and their associated tasks."}
				</p>
			</div>

			{/* Summary */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
						<CardDescription className="text-2xl font-semibold text-foreground">{totalTasks}</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
						<CardDescription className="text-2xl font-semibold text-foreground">{pendingTasks}</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
						<CardDescription className="text-2xl font-semibold text-foreground">{completedTasks}</CardDescription>
					</CardHeader>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="py-4">
					<div className="flex flex-wrap items-center gap-3">
						{/* Search */}
						<div className="relative flex-1 min-w-[200px] max-w-sm">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search work items or tasks..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Status Filter */}
						<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
							<SelectTrigger className="w-[140px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
							</SelectContent>
						</Select>

						{/* Task Type Filter */}
						<Select value={taskTypeFilter} onValueChange={(v) => setTaskTypeFilter(v as TaskTypeFilter)}>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="Task Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="document">Documents</SelectItem>
								<SelectItem value="questionnaire">Questionnaires</SelectItem>
								<SelectItem value="chat">Chat</SelectItem>
							</SelectContent>
						</Select>

						{/* Client Filter (Staff Only) */}
						{isStaff && uniqueClients.length > 0 && (
							<Select value={clientFilter} onValueChange={setClientFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Client" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Clients</SelectItem>
									{uniqueClients.map((client) => (
										<SelectItem key={client.id} value={client.id}>
											{client.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{/* Clear Filters */}
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
								<X className="h-4 w-4 mr-1" />
								Clear
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Work Items Table */}
			<Card>
				<CardHeader>
					<CardTitle>Work Items</CardTitle>
					<CardDescription>
						{hasActiveFilters ? (
							<>
								Showing {filteredWorkItems.length} of {workItemsWithTasks.length} work items ({filteredTotalTasks} tasks)
							</>
						) : (
							<>
								{workItemsWithTasks.length} work item{workItemsWithTasks.length !== 1 ? "s" : ""} with {totalTasks} total task
								{totalTasks !== 1 ? "s" : ""}
							</>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{filteredWorkItems.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[50px]"></TableHead>
										<TableHead>Name</TableHead>
										{isStaff && <TableHead>Client</TableHead>}
										<TableHead>Status</TableHead>
										<TableHead>Tasks</TableHead>
										<TableHead>Due Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredWorkItems.map((workItem) => (
										<WorkItemRow key={workItem._id} workItem={workItem} isStaff={isStaff} />
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12">
							<CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								{hasActiveFilters ? "No work items match your filters" : "No work items found"}
							</p>
							{hasActiveFilters && (
								<Button variant="link" onClick={clearFilters} className="mt-2">
									Clear filters
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function WorkItemRow({
	workItem,
	isStaff = false,
}: {
	workItem: {
		_id: string;
		name?: string;
		status: string;
		dueAt?: number;
		account?: { _id: string; name: string; type: "personal" | "business" };
		tasks: Array<{
			_id: string;
			name: string;
			status: string;
			type?: "document" | "questionnaire" | "question" | "chat";
			description?: string;
			dueAt?: number;
		}>;
	};
	isStaff?: boolean;
}) {
	const router = useRouter();
	const [isExpanded, setIsExpanded] = useState(false);
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
	const [selectedChatTaskId, setSelectedChatTaskId] = useState<string | null>(null);

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

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return null;
		return new Date(timestamp).toLocaleDateString();
	};

	const pendingTasksCount = workItem.tasks.filter((task) => !isCompletedStatus(task.status)).length;

	const handleRowClick = () => {
		if (workItem.tasks.length > 0) {
			setIsExpanded(!isExpanded);
		}
	};

	const workItemBgColor = getStatusBackgroundColor(workItem.status);

	return (
		<>
			<TableRow className={`${workItemBgColor} hover:bg-muted/50 ${workItem.tasks.length > 0 ? "cursor-pointer" : ""}`} onClick={handleRowClick}>
				<TableCell>
					{workItem.tasks.length > 0 && (
						<span className="flex items-center justify-center h-6 w-6">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
					)}
				</TableCell>
				<TableCell className="font-medium">{workItem.name || "Untitled Work Item"}</TableCell>
				{isStaff && (
					<TableCell>
						<span className="text-sm">{workItem.account?.name || "—"}</span>
					</TableCell>
				)}
				<TableCell>
					<Badge className={`flex items-center gap-1 w-fit ${getStatusBadgeClassName(workItem.status)}`}>
						{getStatusIcon(workItem.status)}
						{workItem.status}
					</Badge>
				</TableCell>
				<TableCell>
					{workItem.tasks.length > 0 ? (
						<span className="text-sm">
							{pendingTasksCount} pending / {workItem.tasks.length} total
						</span>
					) : (
						<span className="text-sm text-muted-foreground">No tasks</span>
					)}
				</TableCell>
				<TableCell>{workItem.dueAt ? <span className="text-sm">{formatDate(workItem.dueAt)}</span> : <span className="text-sm text-muted-foreground">—</span>}</TableCell>
			</TableRow>
			{isExpanded && workItem.tasks.length > 0 && (
				<TableRow>
					<TableCell colSpan={isStaff ? 6 : 5} className="p-0 bg-muted/20">
						<div className="py-3 pl-12 pr-4">
							<div className="rounded-lg border bg-background overflow-hidden">
								{/* Task Header */}
								<div className="grid grid-cols-[1fr_120px_1fr_100px] gap-4 px-4 py-2 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
									<span>Task Name</span>
									<span>Status</span>
									<span>Description</span>
									<span>Due Date</span>
								</div>
								{/* Task Rows */}
								{workItem.tasks.map((task, index) => (
									<TaskRow
										key={task._id}
										task={task}
										index={index}
										totalTasks={workItem.tasks.length}
										isStaff={isStaff}
										onClick={() => {
											if (task.type === "chat") {
												setSelectedChatTaskId(task._id);
											} else if (task.type === "questionnaire" && (task as any).templateId) {
												// Navigate to questionnaire page.
												router.push(`/dashboard/template/${task._id}`);
											} else if (task.type === "document") {
												setSelectedTaskId(task._id);
											}
										}}
									/>
								))}
							</div>
						</div>
					</TableCell>
				</TableRow>
			)}
			{selectedTaskId && (
				<DocumentUploadDialog
					taskId={selectedTaskId}
					open={!!selectedTaskId}
					onOpenChange={(open) => {
						if (!open) {
							setSelectedTaskId(null);
						}
					}}
				/>
			)}
			{selectedChatTaskId && (
				<ChatDialog
					taskId={selectedChatTaskId}
					open={!!selectedChatTaskId}
					onOpenChange={(open) => {
						if (!open) {
							setSelectedChatTaskId(null);
						}
					}}
				/>
			)}
		</>
	);
}

function TaskRow({
	task,
	index,
	totalTasks,
	isStaff,
	onClick,
}: {
	task: {
		_id: string;
		name: string;
		status: string;
		type?: "document" | "questionnaire" | "chat";
		description?: string;
		dueAt?: number;
		templateId?: string;
	};
	index: number;
	totalTasks: number;
	isStaff?: boolean;
	onClick: () => void;
}) {
	const isDocumentTask = task.type === "document";
	const isQuestionnaireTask = task.type === "questionnaire" && task.templateId;
	const isChatTask = task.type === "chat";
	const taskDocument = useQuery(
		api.src.documents.queries.getDocumentsByTaskId,
		isDocumentTask ? { taskId: task._id as any } : "skip",
	);
	const hasDocument = taskDocument && taskDocument.length > 0;
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

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return null;
		return new Date(timestamp).toLocaleDateString();
	};

	const taskBgColor = getStatusBackgroundColor(task.status);

	const isClickable = isDocumentTask || isQuestionnaireTask || isChatTask;

	return (
		<div
			className={`grid grid-cols-[1fr_120px_1fr_100px] gap-4 px-4 py-3 items-center ${taskBgColor} ${
				index !== totalTasks - 1 ? "border-b" : ""
			} ${isClickable ? "cursor-pointer hover:bg-muted/50" : ""}`}
			onClick={isClickable ? onClick : undefined}
		>
			<div className="flex items-center gap-2">
				<span className="font-medium truncate">{task.name}</span>
				{isDocumentTask && (
					<FileText className={`h-4 w-4 ${hasDocument ? "text-primary" : "text-muted-foreground"}`} />
				)}
				{isQuestionnaireTask && (
					<ClipboardList className="h-4 w-4 text-primary" />
				)}
				{isChatTask && (
					<MessageSquare className="h-4 w-4 text-primary" />
				)}
			</div>
			<Badge className={`flex items-center gap-1 w-fit ${getStatusBadgeClassName(task.status)}`}>
				{getStatusIcon(task.status)}
				{task.status}
			</Badge>
			<span className="text-sm text-muted-foreground truncate">{task.description || "—"}</span>
			<span className="text-sm text-muted-foreground">{task.dueAt ? formatDate(task.dueAt) : "—"}</span>
		</div>
	);
}
