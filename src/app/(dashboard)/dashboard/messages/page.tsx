"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Messages</h1>
				<p className="text-muted-foreground mt-1">Communicate with your accounting team.</p>
			</div>

			<Card>
				<CardContent className="flex flex-col items-center justify-center py-24">
					<MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
					<h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
					<p className="text-muted-foreground text-center max-w-md">
						Messaging functionality is currently under development. You&apos;ll be able to communicate directly with your accounting team here soon.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

