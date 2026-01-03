"use client";

import { useAccount } from "@/components/providers/account-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { AlertCircle, CheckSquare, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

export default function WorkItemsPage() {
	const { selectedAccountId } = useAccount();
	const workItemsWithTasks = useQuery(api.src.workItems.queries.getWorkItemsWithTasks, selectedAccountId ? { accountId: selectedAccountId } : "skip");

	if (!selectedAccountId) {
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

	const totalTasks = workItemsWithTasks.reduce((sum, item) => sum + item.tasks.length, 0);
	const pendingTasks = workItemsWithTasks.reduce(
		(sum, item) =>
			sum + item.tasks.filter((task) => task.status.toLowerCase() !== "done" && task.status.toLowerCase() !== "completed" && task.status.toLowerCase() !== "closed").length,
		0,
	);
	const completedTasks = workItemsWithTasks.reduce(
		(sum, item) =>
			sum + item.tasks.filter((task) => task.status.toLowerCase() === "done" || task.status.toLowerCase() === "completed" || task.status.toLowerCase() === "closed").length,
		0,
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Work Items</h1>
				<p className="text-muted-foreground mt-1">Manage your work items and their associated tasks.</p>
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

			{/* Work Items Table */}
			<Card>
				<CardHeader>
					<CardTitle>Work Items</CardTitle>
					<CardDescription>
						{workItemsWithTasks.length} work item{workItemsWithTasks.length !== 1 ? "s" : ""} with {totalTasks} total task{totalTasks !== 1 ? "s" : ""}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{workItemsWithTasks.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[50px]"></TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Tasks</TableHead>
										<TableHead>Due Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{workItemsWithTasks.map((workItem) => (
										<WorkItemRow key={workItem._id} workItem={workItem} />
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12">
							<CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No work items found</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function WorkItemRow({
	workItem,
}: {
	workItem: {
		_id: string;
		name?: string;
		status: string;
		dueAt?: number;
		tasks: Array<{
			_id: string;
			name: string;
			status: string;
			description?: string;
			dueAt?: number;
		}>;
	};
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	const getStatusIcon = (status: string) => {
		const s = status.toLowerCase();
		if (s === "urgent" || s === "pending") {
			return <AlertCircle className="h-4 w-4" />;
		}
		if (s === "done" || s === "completed" || s === "closed") {
			return <CheckSquare className="h-4 w-4" />;
		}
		return <Clock className="h-4 w-4" />;
	};

	const getStatusVariant = (status: string): "default" | "destructive" | "outline" => {
		const s = status.toLowerCase();
		if (s === "urgent") return "destructive";
		if (s === "done" || s === "completed" || s === "closed") return "default";
		return "outline";
	};

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return null;
		return new Date(timestamp).toLocaleDateString();
	};

	const pendingTasksCount = workItem.tasks.filter(
		(task) => task.status.toLowerCase() !== "done" && task.status.toLowerCase() !== "completed" && task.status.toLowerCase() !== "closed",
	).length;

	const handleRowClick = () => {
		if (workItem.tasks.length > 0) {
			setIsExpanded(!isExpanded);
		}
	};

	return (
		<>
			<TableRow className={`hover:bg-muted/50 ${workItem.tasks.length > 0 ? "cursor-pointer" : ""}`} onClick={handleRowClick}>
				<TableCell>
					{workItem.tasks.length > 0 && (
						<span className="flex items-center justify-center h-6 w-6">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
					)}
				</TableCell>
				<TableCell className="font-medium">{workItem.name || "Untitled Work Item"}</TableCell>
				<TableCell>
					<Badge variant={getStatusVariant(workItem.status)} className="flex items-center gap-1 w-fit">
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
					<TableCell colSpan={5} className="p-0 bg-muted/20">
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
									<div
										key={task._id}
										className={`grid grid-cols-[1fr_120px_1fr_100px] gap-4 px-4 py-3 items-center ${index !== workItem.tasks.length - 1 ? "border-b" : ""}`}
									>
										<span className="font-medium truncate">{task.name}</span>
										<Badge variant={getStatusVariant(task.status)} className="flex items-center gap-1 w-fit">
											{getStatusIcon(task.status)}
											{task.status}
										</Badge>
										<span className="text-sm text-muted-foreground truncate">{task.description || "—"}</span>
										<span className="text-sm text-muted-foreground">{task.dueAt ? formatDate(task.dueAt) : "—"}</span>
									</div>
								))}
							</div>
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}
