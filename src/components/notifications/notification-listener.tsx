"use client";

import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Component that listens for new notifications and displays them as toasts.
 * Should be placed in the dashboard layout.
 */
export function NotificationListener() {
	const userId = useQuery(api.src.users.queries.me);
	const unreadNotifications = useQuery(
		api.src.notifications.queries.getUnreadNotifications,
		userId?._id ? { userId: userId._id, limit: 10 } : "skip",
	);
	const markAsRead = useMutation(api.src.notifications.mutations.markNotificationAsRead);
	const shownNotificationIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!unreadNotifications || unreadNotifications.length === 0) {
			return;
		}

		// Get the most recent unread notification that we haven't shown yet.
		const unshownNotifications = unreadNotifications.filter(
			(n) => !shownNotificationIdsRef.current.has(n._id),
		);

		if (unshownNotifications.length === 0) {
			return;
		}

		// Show the most recent unshown notification.
		const mostRecent = unshownNotifications[0];

		// Show toast based on notification type.
		if (mostRecent.type === "task_assigned" || mostRecent.type === "task_reopened") {
			toast.info(mostRecent.title, {
				description: mostRecent.message,
				duration: 5000,
			});
		} else if (mostRecent.type === "task_completed" || mostRecent.type === "workitem_completed") {
			toast.success(mostRecent.title, {
				description: mostRecent.message,
				duration: 5000,
			});
		} else if (mostRecent.type === "task_reminder") {
			toast.warning(mostRecent.title, {
				description: mostRecent.message,
				duration: 7000,
			});
		}

		// Mark this notification as shown.
		shownNotificationIdsRef.current.add(mostRecent._id);

		// Mark as read after showing toast.
		markAsRead({ id: mostRecent._id }).catch((error) => {
			console.error("Failed to mark notification as read:", error);
		});
	}, [unreadNotifications, markAsRead]);

	return null;
}

