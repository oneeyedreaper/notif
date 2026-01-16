"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Bell, Loader2, Mail, RefreshCw } from "lucide-react";

export default function LoginPage() {
	const router = useRouter();
	const { login, isAuthenticated } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showResend, setShowResend] = useState(false);
	const [unverifiedEmail, setUnverifiedEmail] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);

	// Redirect if already logged in
	if (isAuthenticated) {
		router.push("/");
		return null;
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setShowResend(false);
		setResendSuccess(false);
		setIsLoading(true);

		try {
			await login(email, password);
			router.push("/");
		} catch (err: any) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to login";
			setError(errorMessage);

			// Check if it's an email verification error
			if (errorMessage.toLowerCase().includes("verify your email")) {
				setShowResend(true);
				setUnverifiedEmail(email);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendEmail = async () => {
		setResendLoading(true);
		setResendSuccess(false);

		try {
			await api.resendVerificationEmail(unverifiedEmail);
			setResendSuccess(true);
			setError("");
		} catch (err) {
			// Still show success for security (don't reveal if email exists)
			setResendSuccess(true);
		} finally {
			setResendLoading(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
			<div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-transparent to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 -z-10" />

			<Card className="w-full max-w-md glass-card">
				<CardHeader className="text-center">
					<div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
						<Bell className="h-8 w-8 text-white" />
					</div>
					<CardTitle className="text-2xl">Welcome back</CardTitle>
					<CardDescription>Sign in to your account to continue</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && !resendSuccess && (
							<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
								{error}
							</div>
						)}

						{resendSuccess && (
							<div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center gap-2">
								<Mail className="h-4 w-4" />
								Verification email sent! Check your inbox.
							</div>
						)}

						{showResend && !resendSuccess && (
							<div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
								<p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
									Your email is not verified yet. Click below to receive a new
									verification link.
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleResendEmail}
									disabled={resendLoading}
									className="w-full"
								>
									{resendLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending...
										</>
									) : (
										<>
											<RefreshCw className="mr-2 h-4 w-4" />
											Resend Verification Email
										</>
									)}
								</Button>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col gap-4">
						<Button
							type="submit"
							variant="gradient"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Sign in"
							)}
						</Button>

						<p className="text-sm text-muted-foreground text-center">
							Don&apos;t have an account?{" "}
							<Link href="/register" className="text-primary hover:underline">
								Create one
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
