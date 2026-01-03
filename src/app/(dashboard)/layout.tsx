"use client";

import { AccountProvider, useAccount } from "@/components/providers/account-provider";
import { AccountSelector } from "@/components/account-selector";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuBadge,
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	CheckSquare,
	FileText,
	BarChart3,
	MessageSquare,
	Landmark,
} from "lucide-react";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AccountProvider>
			<SidebarProvider>
				<div className="flex min-h-screen w-full">
					<Sidebar>
						<SidebarHeader className="border-b border-sidebar-border p-4">
							<div className="flex items-center gap-2 px-2">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
									<Landmark className="h-5 w-5" />
								</div>
								<span className="font-semibold text-lg">MAD</span>
							</div>
						</SidebarHeader>
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<NavMenu />
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
						<SidebarFooter className="border-t border-sidebar-border p-4">
							<UserProfile />
						</SidebarFooter>
					</Sidebar>
					<SidebarInset className="flex-1">
						<header className="flex h-16 items-center gap-4 border-b border-border px-6">
							<SidebarTrigger />
							<div className="ml-auto flex items-center gap-4">
								<AccountSelector />
							</div>
						</header>
						<main className="flex-1 overflow-auto p-6">{children}</main>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</AccountProvider>
	);
}

function NavMenu() {
	const pathname = usePathname();
	const { selectedAccountId } = useAccount();
	const overview = useQuery(
		api.src.dashboard.queries.getOverview,
		selectedAccountId ? { accountId: selectedAccountId } : "skip",
	);

	const navItems = [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: LayoutDashboard,
		},
		{
			title: "Work Items",
			url: "/dashboard/work-items",
			icon: CheckSquare,
			badge: overview?.pendingTasksCount ?? 0,
		},
		{
			title: "Documents",
			url: "/dashboard/documents",
			icon: FileText,
		},
		{
			title: "Financial Reports",
			url: "/dashboard/reports",
			icon: BarChart3,
		},
		{
			title: "Messages",
			url: "/dashboard/messages",
			icon: MessageSquare,
		},
	];

	return (
		<SidebarMenu>
			{navItems.map((item) => {
				const Icon = item.icon;
				const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
				return (
					<SidebarMenuItem key={item.url}>
						<SidebarMenuButton asChild isActive={isActive} className="text-base py-2.5 px-4">
							<Link href={item.url}>
								<Icon />
								<span>{item.title}</span>
								{item.badge !== undefined && item.badge > 0 && (
									<SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
								)}
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}

function UserProfile() {
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const user = userData?.user;

	if (!user) {
		return (
			<div className="flex items-center gap-2 px-2">
				<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
				<div className="flex-1 space-y-1">
					<div className="h-4 w-24 animate-pulse rounded bg-muted" />
					<div className="h-3 w-32 animate-pulse rounded bg-muted" />
				</div>
			</div>
		);
	}

	const displayName =
		user.firstName && user.lastName
			? `${user.firstName} ${user.lastName}`
			: user.firstName || user.email || "User";

	const initials = user.firstName && user.lastName
		? `${user.firstName[0]}${user.lastName[0]}`
		: user.firstName
			? user.firstName[0]
			: user.email
				? user.email[0].toUpperCase()
				: "U";

	return (
		<div className="flex items-center gap-2 px-2">
			<Avatar className="h-8 w-8">
				{user.image && <AvatarImage src={user.image} alt={displayName} />}
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div className="flex flex-1 flex-col overflow-hidden">
				<span className="truncate text-sm font-medium">{displayName}</span>
				{user.email && (
					<span className="truncate text-xs text-muted-foreground">{user.email}</span>
				)}
			</div>
		</div>
	);
}
