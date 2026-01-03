"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Financial Reports</h1>
				<p className="text-muted-foreground mt-1">
					View and analyze your financial data.
				</p>
			</div>

			<Card>
				<CardContent className="flex flex-col items-center justify-center py-24">
					<BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
					<h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
					<p className="text-muted-foreground text-center max-w-md">
						Financial reports and analytics are currently under development. Check back soon for
						detailed insights into your financial data.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

