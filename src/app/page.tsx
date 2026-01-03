"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useConvexAuth } from "convex/react";
import Link from "next/link";

export default function Home() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Welcome</CardTitle>
					<CardDescription>{isAuthenticated ? "You are signed in. Access your dashboard to get started." : "Please sign in to access your dashboard."}</CardDescription>
				</CardHeader>
				<CardContent>
					{isAuthenticated ? (
						<Button asChild className="w-full" size="lg">
							<Link href="/dashboard">Go to Dashboard</Link>
						</Button>
					) : (
						<Button asChild className="w-full" size="lg">
							<Link href="/login">Login</Link>
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
