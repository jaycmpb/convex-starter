"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { TemplateBuilder } from "@/components/templates/template-builder";
import { Loader2 } from "lucide-react";

export default function EditTemplatePage() {
	const router = useRouter();
	const params = useParams();
	const templateId = params.id as string;
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const isStaff = userData?.user?.isStaff ?? false;
	const isLoading = userData === undefined;

	// Redirect non-staff users away from templates page.
	useEffect(() => {
		if (!isLoading && !isStaff) {
			router.replace("/dashboard");
		}
	}, [isLoading, isStaff, router]);

	if (isLoading || !isStaff) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Edit Template</h1>
				<p className="text-muted-foreground mt-1">Update the questionnaire template.</p>
			</div>

			<TemplateBuilder
				templateId={templateId}
				onClose={() => {
					router.push("/dashboard/templates");
				}}
			/>
		</div>
	);
}
