"use client";

import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { createContext, useContext, useEffect, useCallback, ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";

type Account = {
	_id: Id<"accounts">;
	name: string;
	type: "personal" | "business";
	externalId?: string;
	deletedAt?: number;
};

type AccountContextValue = {
	selectedAccountId: Id<"accounts"> | null;
	accounts: Account[];
	isLoading: boolean;
	setSelectedAccount: (accountId: Id<"accounts">) => void;
};

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const setSelectedAccountMutation = useMutation(api.src.users.mutations.setSelectedAccount);

	const selectedAccountId = userData?.selectedAccount?._id ?? null;
	const accounts = userData?.accounts ?? [];
	const isLoading = userData === undefined;

	const setSelectedAccount = useCallback(
		(accountId: Id<"accounts">) => {
			setSelectedAccountMutation({ accountId });
		},
		[setSelectedAccountMutation],
	);

	// Auto-select first account if none is selected and accounts are available.
	useEffect(() => {
		if (!isLoading && !selectedAccountId && accounts.length > 0) {
			setSelectedAccount(accounts[0]._id);
		}
	}, [isLoading, selectedAccountId, accounts, setSelectedAccount]);

	return (
		<AccountContext.Provider
			value={{
				selectedAccountId,
				accounts,
				isLoading,
				setSelectedAccount,
			}}
		>
			{children}
		</AccountContext.Provider>
	);
}

export function useAccount() {
	const context = useContext(AccountContext);
	if (context === undefined) {
		throw new Error("useAccount must be used within an AccountProvider");
	}
	return context;
}

