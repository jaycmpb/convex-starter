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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	CheckSquare,
	FileText,
	BarChart3,
	MessageSquare,
	Landmark,
	LogOut,
	ChevronsUpDown,
	Users,
	LayoutTemplate,
} from "lucide-react";
import { NotificationListener } from "@/components/notifications/notification-listener";
import { NotificationBell } from "@/components/notifications/notification-bell";

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
						<NotificationListener />
						<Header />
						<main className="flex-1 overflow-auto p-6">{children}</main>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</AccountProvider>
	);
}

function Header() {
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const user = userData?.user;
	const isStaff = user?.isStaff ?? false;

	return (
		<header className="flex h-16 items-center gap-4 border-b border-border px-6">
			<SidebarTrigger />
			<div className="ml-auto flex items-center gap-4">
				<NotificationBell />
				{!isStaff && <AccountSelector />}
			</div>
		</header>
	);
}

function NavMenu() {
	const pathname = usePathname();
	const { selectedAccountId } = useAccount();
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const user = userData?.user;
	const isStaff = user?.isStaff ?? false;

	const overview = useQuery(
		api.src.dashboard.queries.getOverview,
		selectedAccountId && !isStaff ? { accountId: selectedAccountId } : "skip",
	);

	const clientNavItems = [
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

	const staffNavItems = [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: LayoutDashboard,
		},
		{
			title: "Work Items",
			url: "/dashboard/work-items",
			icon: CheckSquare,
		},
		{
			title: "Documents",
			url: "/dashboard/documents",
			icon: FileText,
		},
		{
			title: "Clients",
			url: "/dashboard/clients",
			icon: Users,
		},
		{
			title: "Messages",
			url: "/dashboard/messages",
			icon: MessageSquare,
		},
		{
			title: "Templates",
			url: "/dashboard/templates",
			icon: LayoutTemplate,
		},
	];

	const navItems = isStaff ? staffNavItems : clientNavItems;

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
	const router = useRouter();
	const { signOut } = useAuthActions();
	const userData = useQuery(api.src.users.queries.meWithSelectedAccount);
	const user = userData?.user;

	const handleSignOut = async () => {
		await signOut();
		router.push("/login");
	};

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent transition-colors">
					<Avatar className="h-8 w-8">
						{user.image && <AvatarImage src={user.image} alt={displayName} />}
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div className="flex flex-1 flex-col overflow-hidden text-left">
						<span className="truncate text-sm font-medium">{displayName}</span>
						{user.email && (
							<span className="truncate text-xs text-muted-foreground">{user.email}</span>
						)}
					</div>
					<ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="top" className="w-56">
				<DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
					<LogOut className="mr-2 h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
