"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2, CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientWorkItemsDialogProps {
	accountId: Id<"accounts"> | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ClientWorkItemsDialog({ accountId, open, onOpenChange }: ClientWorkItemsDialogProps) {
	const workItems = useQuery(
		api.src.workItems.queries.getWorkItemsForClientByUser,
		open && accountId ? { accountId } : "skip",
	);

	const workItemTypes = useQuery(api.src.workItems.queries.getAllWorkItemTypes);

	const getWorkItemTypeName = (typeId: Id<"workItemTypes">) => {
		const type = workItemTypes?.find((t) => t._id === typeId);
		return type?.name || "Unknown";
	};

	const getStatusIcon = (status: string) => {
		const lowerStatus = status.toLowerCase();
		if (lowerStatus === "complete" || lowerStatus === "completed" || lowerStatus === "done" || lowerStatus === "closed") {
			return <CheckCircle2 className="h-4 w-4 text-green-600" />;
		}
		if (lowerStatus === "in progress" || lowerStatus === "in-progress" || lowerStatus === "working") {
			return <Clock className="h-4 w-4 text-blue-600" />;
		}
		return <Circle className="h-4 w-4 text-gray-400" />;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>Work Items</DialogTitle>
					<DialogDescription>All work items and tasks for this client.</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col flex-1 min-h-0">
					<ScrollArea className="flex-1 border rounded-lg p-4">
						{workItems === undefined ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : workItems.length === 0 ? (
							<div className="flex items-center justify-center py-8 text-muted-foreground">No work items found.</div>
						) : (
							<Accordion type="multiple" className="w-full">
								{workItems.map((workItem) => (
									<AccordionItem key={workItem._id} value={workItem._id}>
										<AccordionTrigger className="hover:no-underline">
											<div className="flex items-center gap-3 flex-1 text-left">
												{getStatusIcon(workItem.status)}
												<div className="flex-1">
													<div className="font-medium">{workItem.name || "Unnamed Work Item"}</div>
													<div className="text-sm text-muted-foreground">
														{getWorkItemTypeName(workItem.typeId)} • {workItem.status}
													</div>
												</div>
												{workItem.tasks.length > 0 && (
													<Badge variant="secondary" className="ml-2">
														{workItem.tasks.length} task{workItem.tasks.length !== 1 ? "s" : ""}
													</Badge>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent>
											{workItem.tasks.length === 0 ? (
												<div className="text-sm text-muted-foreground py-2">No tasks for this work item.</div>
											) : (
												<div className="space-y-3 pt-2">
													{workItem.tasks.map((task) => (
														<div key={task._id} className="border rounded-lg p-3 bg-muted/30">
															<div className="flex items-start justify-between gap-2">
																<div className="flex-1">
																	<div className="flex items-center gap-2 mb-1">
																		{getStatusIcon(task.status)}
																		<span className="font-medium text-sm">{task.name}</span>
																	</div>
																	{task.description && (
																		<p className="text-sm text-muted-foreground mb-2">{task.description}</p>
																	)}
																	<div className="flex items-center gap-4 text-xs text-muted-foreground">
																		{task.type && (
																			<span className="capitalize">
																				Type: <Badge variant="outline" className="ml-1 text-xs">{task.type}</Badge>
																			</span>
																		)}
																		{task.dueAt && (
																			<span>
																				Due: {formatDistanceToNow(new Date(task.dueAt), { addSuffix: true })}
																			</span>
																		)}
																	</div>
																</div>
																<Badge variant={task.status === "Complete" ? "secondary" : "outline"}>{task.status}</Badge>
															</div>
														</div>
													))}
												</div>
											)}
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						)}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}

