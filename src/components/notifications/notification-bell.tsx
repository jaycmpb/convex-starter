"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "./notification-dropdown";

/**
 * Notification bell component with unread count badge.
 * Shows a dropdown with recent notifications when clicked.
 */
export function NotificationBell() {
	const userId = useQuery(api.src.users.queries.me);
	const unreadCount = useQuery(
		api.src.notifications.queries.getUnreadNotificationCount,
		userId?._id ? { userId: userId._id } : "skip",
	);

	if (!userId) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					{unreadCount !== undefined && unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<NotificationDropdown userId={userId._id} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

