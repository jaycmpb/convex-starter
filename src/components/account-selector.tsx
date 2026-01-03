"use client";

import { useAccount } from "@/components/providers/account-provider";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Id } from "@convex/_generated/dataModel";

export function AccountSelector() {
	const { selectedAccountId, accounts, isLoading, setSelectedAccount } = useAccount();

	if (isLoading) {
		return (
			<div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
		);
	}

	if (accounts.length === 0) {
		return null;
	}

	const selectedAccount = accounts.find((acc) => acc._id === selectedAccountId);

	return (
		<Select
			value={selectedAccountId ?? undefined}
			onValueChange={(value) => setSelectedAccount(value as Id<"accounts">)}
		>
			<SelectTrigger className="w-full">
				<SelectValue>
					{selectedAccount ? (
						<div className="flex items-center gap-2">
							<span>{selectedAccount.name}</span>
							<Badge variant="outline" className="text-xs">
								{selectedAccount.type === "personal" ? "Personal" : "Business"}
							</Badge>
						</div>
					) : (
						"Select Account"
					)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{accounts.map((account) => (
					<SelectItem key={account._id} value={account._id}>
						<div className="flex items-center gap-2">
							<span>{account.name}</span>
							<Badge variant="outline" className="text-xs">
								{account.type === "personal" ? "Personal" : "Business"}
							</Badge>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

