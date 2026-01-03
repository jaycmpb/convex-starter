"use client";

import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
	userId: Id<"users">;
}

/**
 * Dropdown content showing recent notifications.
 */
export function NotificationDropdown({ userId }: NotificationDropdownProps) {
	const notifications = useQuery(api.src.notifications.queries.getNotifications, {
		userId,
		limit: 20,
	});
	const markAsRead = useMutation(api.src.notifications.mutations.markNotificationAsRead);
	const markAllAsRead = useMutation(api.src.notifications.mutations.markAllNotificationsAsRead);

	const getNotificationIcon = (type: string) => {
		if (type === "task_assigned" || type === "task_reopened") {
			return <Clock className="h-4 w-4" />;
		}
		if (type === "task_completed" || type === "workitem_completed") {
			return <CheckSquare className="h-4 w-4" />;
		}
		if (type === "task_reminder") {
			return <AlertCircle className="h-4 w-4" />;
		}
		return null;
	};

	const getNotificationVariant = (type: string): "default" | "destructive" | "outline" => {
		if (type === "task_assigned" || type === "task_reopened") return "outline";
		if (type === "task_completed" || type === "workitem_completed") return "default";
		if (type === "task_reminder") return "destructive";
		return "default";
	};

	const handleMarkAsRead = async (id: Id<"notifications">) => {
		try {
			await markAsRead({ id });
		} catch (error) {
			console.error("Failed to mark notification as read:", error);
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsRead({ userId });
		} catch (error) {
			console.error("Failed to mark all notifications as read:", error);
		}
	};

	if (notifications === undefined) {
		return (
			<div className="p-4 text-center text-sm text-muted-foreground">
				Loading notifications...
			</div>
		);
	}

	if (notifications.length === 0) {
		return (
			<div className="p-4 text-center text-sm text-muted-foreground">
				No notifications
			</div>
		);
	}

	const unreadCount = notifications.filter((n) => !n.readAt).length;

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between border-b px-4 py-2">
				<span className="text-sm font-semibold">Notifications</span>
				{unreadCount > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						onClick={handleMarkAllAsRead}
					>
						Mark all as read
					</Button>
				)}
			</div>
			<ScrollArea className="h-[400px]">
				<div className="divide-y">
					{notifications.map((notification) => {
						const isUnread = !notification.readAt;
						return (
							<div
								key={notification._id}
								className={`px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${
									isUnread ? "bg-muted/30" : ""
								}`}
								onClick={() => {
									if (isUnread) {
										handleMarkAsRead(notification._id);
									}
								}}
							>
								<div className="flex items-start gap-3">
									<div className="mt-0.5">
										{getNotificationIcon(notification.type)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-sm font-medium">{notification.title}</span>
											<Badge
												variant={getNotificationVariant(notification.type)}
												className="text-xs"
											>
												{notification.type.replace("_", " ")}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground mb-1">
											{notification.message}
										</p>
										<span className="text-xs text-muted-foreground">
											{formatDistanceToNow(notification._creationTime, {
												addSuffix: true,
											})}
										</span>
									</div>
									{isUnread && (
										<div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
									)}
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}

