"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	User,
	LogOut,
	Settings,
	Bell,
	Sun,
	Moon,
	Monitor,
	FileText,
} from "lucide-react";

export function Header() {
	const { user, isAuthenticated, logout } = useAuth();
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<div className="gradient-primary p-2 rounded-lg">
						<Bell className="h-5 w-5 text-white" />
					</div>
					<span className="font-bold text-xl gradient-text">NotifyHub</span>
				</Link>

				{/* Right side */}
				<div className="flex items-center gap-4">
					{isAuthenticated ? (
						<>
							{/* Notification Bell */}
							<NotificationBell />

							{/* User Menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="relative h-10 w-10 rounded-full p-0"
									>
										<div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
											{user?.name?.charAt(0).toUpperCase() || "U"}
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">
												{user?.name}
											</p>
											<p className="text-xs leading-none text-muted-foreground">
												{user?.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />

									{/* Theme Toggle Row */}
									<div className="px-2 py-2">
										<p className="text-xs font-medium text-muted-foreground mb-2">
											Theme
										</p>
										<div className="flex gap-1">
											<Button
												variant={theme === "light" ? "default" : "ghost"}
												size="sm"
												className="flex-1 h-8"
												onClick={() => setTheme("light")}
											>
												<Sun className="h-4 w-4" />
											</Button>
											<Button
												variant={theme === "dark" ? "default" : "ghost"}
												size="sm"
												className="flex-1 h-8"
												onClick={() => setTheme("dark")}
											>
												<Moon className="h-4 w-4" />
											</Button>
											<Button
												variant={theme === "system" ? "default" : "ghost"}
												size="sm"
												className="flex-1 h-8"
												onClick={() => setTheme("system")}
											>
												<Monitor className="h-4 w-4" />
											</Button>
										</div>
									</div>

									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/profile" className="cursor-pointer">
											<User className="mr-2 h-4 w-4" />
											<span>Profile</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/notifications" className="cursor-pointer">
											<Bell className="mr-2 h-4 w-4" />
											<span>Notifications</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/templates" className="cursor-pointer">
											<FileText className="mr-2 h-4 w-4" />
											<span>Templates</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/settings" className="cursor-pointer">
											<Settings className="mr-2 h-4 w-4" />
											<span>Settings</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="cursor-pointer text-destructive focus:text-destructive"
										onClick={handleLogout}
									>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<div className="flex items-center gap-2">
							<Link href="/login">
								<Button variant="ghost">Sign in</Button>
							</Link>
							<Link href="/register">
								<Button variant="gradient">Get Started</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
