"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
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
import { Bell, Loader2, Mail, CheckCircle } from "lucide-react";

export default function RegisterPage() {
	const router = useRouter();
	const { register, isAuthenticated } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [registrationComplete, setRegistrationComplete] = useState(false);

	// Redirect if already logged in
	if (isAuthenticated) {
		router.push("/");
		return null;
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await register(email, password, name, phone || undefined);
			setRegistrationComplete(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to register");
		} finally {
			setIsLoading(false);
		}
	};

	// Success screen after registration
	if (registrationComplete) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
				<div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-transparent to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 -z-10" />

				<Card className="w-full max-w-md glass-card text-center">
					<CardHeader>
						<div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
							<Mail className="h-10 w-10 text-green-600 dark:text-green-400" />
						</div>
						<CardTitle className="text-2xl flex items-center justify-center gap-2">
							<CheckCircle className="h-6 w-6 text-green-500" />
							Check Your Email
						</CardTitle>
						<CardDescription className="text-base mt-2">
							We&apos;ve sent a verification link to:
						</CardDescription>
						<p className="font-medium text-lg mt-1">{email}</p>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
							<p>Click the link in your email to verify your account.</p>
							<p className="mt-2">
								The link expires in <strong>24 hours</strong>.
							</p>
						</div>
					</CardContent>

					<CardFooter className="flex flex-col gap-4">
						<Link href="/login" className="w-full">
							<Button variant="gradient" className="w-full">
								Go to Login
							</Button>
						</Link>
						<p className="text-sm text-muted-foreground">
							Didn&apos;t receive the email? Check your spam folder or try
							logging in to resend.
						</p>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
			<div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-transparent to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 -z-10" />

			<Card className="w-full max-w-md glass-card">
				<CardHeader className="text-center">
					<div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
						<Bell className="h-8 w-8 text-white" />
					</div>
					<CardTitle className="text-2xl">Create an account</CardTitle>
					<CardDescription>Get started with Notif today</CardDescription>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

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
								minLength={6}
								disabled={isLoading}
							/>
							<p className="text-xs text-muted-foreground">
								Must be at least 6 characters
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Phone (optional)</Label>
							<Input
								id="phone"
								type="tel"
								placeholder="+1 234 567 8900"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
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
									Creating account...
								</>
							) : (
								"Create account"
							)}
						</Button>

						<p className="text-sm text-muted-foreground text-center">
							Already have an account?{" "}
							<Link href="/login" className="text-primary hover:underline">
								Sign in
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
