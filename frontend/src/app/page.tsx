"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Bell, Mail, MessageSquare, Zap, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
	const { isAuthenticated, user } = useAuth();
	const { unreadCount } = useNotifications();

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="relative overflow-hidden py-20 lg:py-32">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-transparent to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20" />

				{/* Floating orbs */}
				<div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-pulse" />
				<div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-pulse animation-delay-2000" />

				<div className="container relative z-10">
					<div className="max-w-3xl mx-auto text-center">
						<h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
							Smart <span className="gradient-text">Notifications</span>
							<br />
							for Modern Apps
						</h1>
						<p className="text-lg md:text-xl text-muted-foreground mb-8">
							A complete notification management system with email/SMS
							integration, real-time updates, and beautiful UI. Stay connected
							with your users.
						</p>

						{isAuthenticated ? (
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
								<Link href="/notifications">
									<Button size="lg" variant="gradient" className="text-lg px-8">
										<Bell className="mr-2 h-5 w-5" />
										View Notifications
										{unreadCount > 0 && (
											<span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
												{unreadCount}
											</span>
										)}
									</Button>
								</Link>
								<Link href="/settings">
									<Button size="lg" variant="outline" className="text-lg px-8">
										Manage Settings
									</Button>
								</Link>
							</div>
						) : (
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
								<Link href="/register">
									<Button size="lg" variant="gradient" className="text-lg px-8">
										Get Started
									</Button>
								</Link>
								<Link href="/login">
									<Button size="lg" variant="outline" className="text-lg px-8">
										Sign In
									</Button>
								</Link>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-muted/50">
				<div className="container">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Everything you need to manage notifications at scale
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						<Card className="glass-card">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
									<Zap className="h-6 w-6 text-white" />
								</div>
								<CardTitle>Real-time Updates</CardTitle>
								<CardDescription>
									Instant push notifications via WebSocket. No refresh needed.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
									<Mail className="h-6 w-6 text-white" />
								</div>
								<CardTitle>Email Integration</CardTitle>
								<CardDescription>
									Send email notifications with customizable templates.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4">
									<MessageSquare className="h-6 w-6 text-white" />
								</div>
								<CardTitle>SMS Support</CardTitle>
								<CardDescription>
									Reach users via SMS for critical notifications.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mb-4">
									<Bell className="h-6 w-6 text-white" />
								</div>
								<CardTitle>Smart Templates</CardTitle>
								<CardDescription>
									Create reusable templates with variable substitution.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center mb-4">
									<Shield className="h-6 w-6 text-white" />
								</div>
								<CardTitle>User Preferences</CardTitle>
								<CardDescription>
									Let users control how and when they receive notifications.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="glass-card">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center mb-4">
									<Clock className="h-6 w-6 text-white" />
								</div>
								<CardTitle>Quiet Hours</CardTitle>
								<CardDescription>
									Respect user&apos;s time with configurable do-not-disturb
									periods.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			{!isAuthenticated && (
				<section className="py-20">
					<div className="container">
						<div className="max-w-3xl mx-auto text-center glass-card p-12">
							<h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
							<p className="text-muted-foreground mb-8">
								Create your free account and start managing notifications today.
							</p>
							<Link href="/register">
								<Button size="lg" variant="gradient" className="text-lg px-8">
									Create Free Account
								</Button>
							</Link>
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
