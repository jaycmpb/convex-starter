"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";

export default function TemplatesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Templates</h1>
				<p className="text-muted-foreground mt-1">Manage document and work item templates.</p>
			</div>

			<Card>
				<CardContent className="flex flex-col items-center justify-center py-24">
					<LayoutTemplate className="h-16 w-16 text-muted-foreground mb-4" />
					<h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
					<p className="text-muted-foreground text-center max-w-md">
						Templates functionality is currently under development. You&apos;ll be able to create and manage templates here soon.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

