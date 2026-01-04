"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientWorkItemsDialog } from "@/components/clients/client-work-items-dialog";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Users, Building2, User } from "lucide-react";
import { useState } from "react";

export default function ClientsPage() {
	const clients = useQuery(api.src.accounts.queries.getAllClients);
	const [selectedClientId, setSelectedClientId] = useState<Id<"accounts"> | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold">Clients</h1>
				<p className="text-muted-foreground mt-1">View and manage all client accounts.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Clients</CardTitle>
					<CardDescription>
						{clients === undefined ? "Loading..." : `${clients.length} client${clients.length !== 1 ? "s" : ""} total`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{clients === undefined ? (
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					) : clients.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Users className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No clients found</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>External ID</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{clients.map((client) => (
										<TableRow
											key={client._id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => {
												setSelectedClientId(client._id);
												setIsDialogOpen(true);
											}}
										>
											<TableCell className="font-medium">
												<div className="flex items-center gap-2">
													{client.type === "business" ? (
														<Building2 className="h-4 w-4 text-muted-foreground" />
													) : (
														<User className="h-4 w-4 text-muted-foreground" />
													)}
													{client.name}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant={client.type === "business" ? "default" : "outline"}>
													{client.type === "business" ? "Business" : "Personal"}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{client.externalId || "—"}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<ClientWorkItemsDialog accountId={selectedClientId} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</div>
	);
}

