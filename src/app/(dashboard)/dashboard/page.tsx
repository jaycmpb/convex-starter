"use client";

import { useAccount } from "@/components/providers/account-provider";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
	ArrowRight,
	Upload,
	CheckCircle2,
	Clock,
	AlertCircle,
	ExternalLink,
	MessageSquare,
	Send,
} from "lucide-react";
import Link from "next/link";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export default function DashboardPage() {
	const { selectedAccountId } = useAccount();
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const overview = useQuery(
		api.src.dashboard.queries.getOverview,
		selectedAccountId ? { accountId: selectedAccountId } : "skip",
	);
	const workItems = useQuery(
		api.src.workItems.queries.getWorkItemsByAccountId,
		selectedAccountId ? { accountId: selectedAccountId } : "skip",
	);

	const user = userData?.user;
	const greeting = user?.firstName
		? `Good ${getTimeOfDay()}, ${user.firstName}`
		: "Good morning";

	const actionItems = workItems
		?.filter((item) => {
			const status = item.status.toLowerCase();
			return status !== "done" && status !== "completed" && status !== "closed";
		})
		.slice(0, 3) ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">{greeting}</h1>
					<p className="text-muted-foreground mt-1">
						Here&apos;s what&apos;s happening with your finances today.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline">Export Data</Button>
					<Button>+ New Request</Button>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							EST. TAX LIABILITY
						</CardTitle>
						<CardDescription className="text-2xl font-semibold text-foreground">
							$12,450.00
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">+2.4% vs last quarter</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							NET REVENUE
						</CardTitle>
						<CardDescription className="text-2xl font-semibold text-foreground">
							$84,320.50
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground">YTD Income</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							ACTION REQUIRED
						</CardTitle>
						<CardDescription className="text-2xl font-semibold text-foreground">
							{overview?.pendingTasksCount ?? 0} Items
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-xs text-muted-foreground mb-2">
							Pending review for tax filing.
						</p>
						<Progress
							value={
								overview?.totalTasksCount
									? ((overview.totalTasksCount - (overview.pendingTasksCount ?? 0)) /
											overview.totalTasksCount) *
										100
									: 0
							}
							className="h-2"
						/>
					</CardContent>
				</Card>
			</div>

			{/* Cash Flow Analysis */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Cash Flow Analysis</CardTitle>
							<CardDescription>
								Income vs Expenses over the last 6 months
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm">
								Quarterly
							</Button>
							<Button variant="default" size="sm">
								Monthly
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<ChartContainer
						config={{
							income: {
								label: "Income",
								color: "hsl(var(--chart-1))",
							},
							expenses: {
								label: "Expenses",
								color: "hsl(var(--chart-2))",
							},
						}}
						className="h-64 w-full"
					>
						<BarChart
							data={[
								{ month: "Jan", income: 12500, expenses: 8200 },
								{ month: "Feb", income: 13200, expenses: 9100 },
								{ month: "Mar", income: 11800, expenses: 7800 },
								{ month: "Apr", income: 14500, expenses: 10200 },
								{ month: "May", income: 13900, expenses: 9800 },
								{ month: "Jun", income: 15200, expenses: 11000 },
							]}
							margin={{ left: 12, right: 12 }}
						>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
							<YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} />
							<ChartTooltip content={<ChartTooltipContent />} />
							<Bar dataKey="income" fill="var(--color-income)" radius={4} />
							<Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			{/* Bottom Section */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Action Items */}
				<Card>
					<CardHeader>
						<CardTitle>Your Action Items</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{actionItems.length > 0 ? (
							actionItems.map((item) => (
								<div
									key={item._id}
									className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
								>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-medium">{item.name || "Untitled Work Item"}</h4>
											<Badge
												variant={
													item.status.toLowerCase() === "urgent"
														? "destructive"
														: item.status.toLowerCase() === "done" ||
																item.status.toLowerCase() === "completed"
															? "default"
															: "outline"
												}
											>
												{item.status}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											Please review and complete this item.
										</p>
									</div>
									<Button variant="ghost" size="icon">
										<ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							))
						) : (
							<p className="text-sm text-muted-foreground text-center py-8">
								No action items at this time.
							</p>
						)}
					</CardContent>
				</Card>

				{/* Right Column */}
				<div className="space-y-6">
					{/* Quick Upload */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Upload</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer">
								<div className="flex flex-col items-center gap-2">
									<Upload className="h-8 w-8 text-muted-foreground" />
									<p className="text-sm text-muted-foreground text-center">
										Click to upload PDF, JPG, or PNG
										<br />
										<span className="text-xs">(Max 10MB)</span>
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 rounded-lg border p-3">
								<CheckCircle2 className="h-5 w-5 text-green-500" />
								<div className="flex-1">
									<p className="text-sm font-medium">1099-NEC.pdf</p>
									<p className="text-xs text-muted-foreground">2.4 MB • Just now</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Accounting Team */}
					<Card>
						<CardHeader>
							<CardTitle>Your Accounting Team</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg border bg-muted/30 p-4">
								<div className="flex items-start gap-3 mb-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
										S
									</div>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-sm font-medium">Sarah</span>
											<span className="text-xs text-muted-foreground">• 10:42 AM</span>
										</div>
										<p className="text-sm text-muted-foreground">
											Hi {user?.firstName || "there"}, I&apos;ve reviewed the Q2 expenses.
											Everything looks great, just need that one receipt!
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Input
										type="text"
										placeholder="Type a message..."
										className="flex-1"
									/>
									<Button size="icon" variant="outline">
										<Send className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Resources */}
					<Card>
						<CardHeader>
							<CardTitle>Resources</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Link
								href="#"
								className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
							>
								<span className="text-sm font-medium">Tax Guide 2024</span>
								<ExternalLink className="h-4 w-4 text-muted-foreground" />
							</Link>
							<Link
								href="#"
								className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
							>
								<span className="text-sm font-medium">Expense Categories</span>
								<ExternalLink className="h-4 w-4 text-muted-foreground" />
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function getTimeOfDay() {
	const hour = new Date().getHours();
	if (hour < 12) return "morning";
	if (hour < 17) return "afternoon";
	return "evening";
}
