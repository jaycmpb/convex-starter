"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";

export default function TemplatesPage() {
	const router = useRouter();
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const isStaff = userData?.user?.isStaff ?? false;
	const isLoading = userData === undefined;

	const templates = useQuery(api.src.templates.queries.listTemplates);
	const deleteTemplate = useMutation(api.src.templates.mutations.deleteTemplate);

	// Redirect non-staff users away from templates page.
	useEffect(() => {
		if (!isLoading && !isStaff) {
			router.replace("/dashboard");
		}
	}, [isLoading, isStaff, router]);

	// Don't render content for non-staff users.
	if (isLoading || !isStaff) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	const handleDelete = async (templateId: string) => {
		if (confirm("Are you sure you want to delete this template?")) {
			try {
				await deleteTemplate({ id: templateId as any });
			} catch (error) {
				console.error("Failed to delete template:", error);
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Templates</h1>
					<p className="text-muted-foreground mt-1">Create and manage questionnaire templates.</p>
				</div>
				<Button asChild>
					<Link href="/dashboard/templates/new">
						<Plus className="h-4 w-4 mr-2" />
						Create Template
					</Link>
				</Button>
			</div>

			{templates === undefined ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			) : templates.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-24">
						<p className="text-muted-foreground mb-4">No templates yet. Create your first template to get started.</p>
						<Button asChild>
							<Link href="/dashboard/templates/new">
								<Plus className="h-4 w-4 mr-2" />
								Create Template
							</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{templates.map((template) => (
						<Card key={template._id}>
							<CardHeader>
								<CardTitle>{template.name}</CardTitle>
								{template.description && <CardDescription>{template.description}</CardDescription>}
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="text-sm text-muted-foreground">
										{template.questions.length} question{template.questions.length !== 1 ? "s" : ""}
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" asChild className="flex-1">
											<Link href={`/dashboard/templates/${template._id}/edit`}>
												<Edit className="h-4 w-4 mr-2" />
												Edit
											</Link>
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDelete(template._id)}
											className="flex-1"
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
