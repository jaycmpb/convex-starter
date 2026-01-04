"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { QuestionnairePage } from "@/components/templates/questionnaire-page";
import { Loader2 } from "lucide-react";

/**
 * Questionnaire page for filling/viewing questionnaire responses.
 * - Staff: View-only mode to see contact responses (id = taskId)
 * - Contacts: Editable questionnaire (id = taskId)
 *
 * Note: Template editing is handled at /dashboard/templates/[templateId]/edit
 */
export default function TemplatePage() {
	const params = useParams();
	const taskId = params.id as string;

	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const isStaff = userData?.user?.isStaff ?? false;
	const isLoading = userData === undefined;

	// Show loading while determining user role.
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	// Both staff and contacts view the questionnaire page.
	// Staff see it in read-only mode, contacts can edit (unless task is Complete).
	return <QuestionnairePage taskId={taskId as Id<"tasks">} isStaff={isStaff} />;
}

