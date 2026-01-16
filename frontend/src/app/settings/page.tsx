"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, UserPreference } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
	Mail,
	MessageSquare,
	Bell,
	Clock,
	Loader2,
	Save,
	Check,
	Phone,
	CheckCircle,
	AlertCircle,
	Shield,
} from "lucide-react";

interface VerificationStatus {
	emailVerified: boolean;
	phoneVerified: boolean;
	hasPhone: boolean;
}

export default function SettingsPage() {
	const router = useRouter();
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [preferences, setPreferences] = useState<UserPreference | null>(null);
	const [verificationStatus, setVerificationStatus] =
		useState<VerificationStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	// Phone verification states
	const [showPhoneVerify, setShowPhoneVerify] = useState(false);
	const [phoneCode, setPhoneCode] = useState("");
	const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
	const [phoneVerifyMessage, setPhoneVerifyMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [codeSent, setCodeSent] = useState(false);

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [authLoading, isAuthenticated, router]);

	useEffect(() => {
		const fetchData = async () => {
			if (!isAuthenticated) return;
			try {
				const [prefResult, statusResult] = await Promise.all([
					api.getPreferences(),
					api.getVerificationStatus(),
				]);
				setPreferences(prefResult.preferences);
				setVerificationStatus(statusResult);
			} catch (error) {
				console.error("Failed to fetch data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		if (isAuthenticated) {
			fetchData();
		}
	}, [isAuthenticated]);

	const handleSave = async () => {
		if (!preferences) return;

		setIsSaving(true);
		setSaved(false);
		try {
			const { preferences: updated } = await api.updatePreferences({
				emailEnabled: preferences.emailEnabled,
				smsEnabled: preferences.smsEnabled,
				pushEnabled: preferences.pushEnabled,
				emailFrequency: preferences.emailFrequency,
				quietHoursStart: preferences.quietHoursStart || undefined,
				quietHoursEnd: preferences.quietHoursEnd || undefined,
			});
			setPreferences(updated);
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch (error) {
			console.error("Failed to save preferences:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const updatePreference = <K extends keyof UserPreference>(
		key: K,
		value: UserPreference[K]
	) => {
		setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
		setSaved(false);
	};

	const handleSendPhoneCode = async () => {
		setPhoneVerifyLoading(true);
		setPhoneVerifyMessage(null);
		try {
			const result = await api.sendPhoneCode();
			setCodeSent(true);
			setPhoneVerifyMessage({ type: "success", text: result.message });
		} catch (error: any) {
			setPhoneVerifyMessage({
				type: "error",
				text: error.message || "Failed to send code",
			});
		} finally {
			setPhoneVerifyLoading(false);
		}
	};

	const handleVerifyPhone = async () => {
		if (phoneCode.length !== 6) {
			setPhoneVerifyMessage({
				type: "error",
				text: "Please enter a 6-digit code",
			});
			return;
		}

		setPhoneVerifyLoading(true);
		setPhoneVerifyMessage(null);
		try {
			const result = await api.verifyPhone(phoneCode);
			setPhoneVerifyMessage({ type: "success", text: result.message });
			setVerificationStatus((prev) =>
				prev ? { ...prev, phoneVerified: true } : null
			);
			setShowPhoneVerify(false);
			setPhoneCode("");
			setCodeSent(false);
		} catch (error: any) {
			setPhoneVerifyMessage({
				type: "error",
				text: error.message || "Verification failed",
			});
		} finally {
			setPhoneVerifyLoading(false);
		}
	};

	const handleResendEmailVerification = async () => {
		try {
			await api.resendVerificationEmail(user!.email);
			alert("Verification email sent! Please check your inbox.");
		} catch (error: any) {
			alert(error.message || "Failed to resend verification email");
		}
	};

	if (authLoading || isLoading) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAuthenticated || !preferences || !verificationStatus) {
		return null;
	}

	return (
		<div className="container py-8">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Settings</h1>
					<p className="text-muted-foreground mt-1">
						Manage your notification preferences
					</p>
				</div>

				<div className="space-y-6">
					{/* Profile Card */}
					<Card className="glass-card">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
									{user?.name?.charAt(0).toUpperCase()}
								</div>
								{user?.name}
							</CardTitle>
							<CardDescription>{user?.email}</CardDescription>
						</CardHeader>
					</Card>

					{/* Verification Status */}
					<Card className="glass-card">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Verification Status
							</CardTitle>
							<CardDescription>
								Verify your contact info to unlock notification channels
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Email Verification */}
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div className="flex items-center gap-3">
									<Mail className="h-5 w-5" />
									<div>
										<p className="font-medium">Email</p>
										<p className="text-sm text-muted-foreground">
											{user?.email}
										</p>
									</div>
								</div>
								{verificationStatus.emailVerified ? (
									<span className="flex items-center gap-1 text-green-500 text-sm">
										<CheckCircle className="h-4 w-4" />
										Verified
									</span>
								) : (
									<Button
										size="sm"
										variant="outline"
										onClick={handleResendEmailVerification}
									>
										Resend Verification
									</Button>
								)}
							</div>

							{/* Phone Verification */}
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div className="flex items-center gap-3">
									<Phone className="h-5 w-5" />
									<div>
										<p className="font-medium">Phone</p>
										<p className="text-sm text-muted-foreground">
											{user?.phone || "Not added"}
										</p>
									</div>
								</div>
								{verificationStatus.phoneVerified ? (
									<span className="flex items-center gap-1 text-green-500 text-sm">
										<CheckCircle className="h-4 w-4" />
										Verified
									</span>
								) : verificationStatus.hasPhone ? (
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowPhoneVerify(true)}
									>
										Verify Phone
									</Button>
								) : (
									<Button
										size="sm"
										variant="outline"
										onClick={() => router.push("/profile")}
									>
										Add Phone
									</Button>
								)}
							</div>

							{/* Phone Verification Form */}
							{showPhoneVerify && !verificationStatus.phoneVerified && (
								<div className="p-4 border rounded-lg space-y-4">
									<h4 className="font-medium">Verify Your Phone Number</h4>

									{!codeSent ? (
										<div className="space-y-2">
											<p className="text-sm text-muted-foreground">
												We&apos;ll send a 6-digit code to {user?.phone}
											</p>
											<Button
												onClick={handleSendPhoneCode}
												disabled={phoneVerifyLoading}
											>
												{phoneVerifyLoading ? (
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												) : null}
												Send Verification Code
											</Button>
										</div>
									) : (
										<div className="space-y-4">
											<div>
												<Label htmlFor="phoneCode">Enter 6-digit code</Label>
												<Input
													id="phoneCode"
													value={phoneCode}
													onChange={(e) =>
														setPhoneCode(
															e.target.value.replace(/\D/g, "").slice(0, 6)
														)
													}
													placeholder="000000"
													maxLength={6}
													className="text-center text-xl tracking-widest"
												/>
											</div>
											<div className="flex gap-2">
												<Button
													onClick={handleVerifyPhone}
													disabled={
														phoneVerifyLoading || phoneCode.length !== 6
													}
												>
													{phoneVerifyLoading ? (
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													) : null}
													Verify
												</Button>
												<Button
													variant="outline"
													onClick={handleSendPhoneCode}
													disabled={phoneVerifyLoading}
												>
													Resend Code
												</Button>
												<Button
													variant="ghost"
													onClick={() => {
														setShowPhoneVerify(false);
														setCodeSent(false);
														setPhoneCode("");
													}}
												>
													Cancel
												</Button>
											</div>
										</div>
									)}

									{phoneVerifyMessage && (
										<div
											className={`flex items-center gap-2 text-sm ${
												phoneVerifyMessage.type === "success"
													? "text-green-500"
													: "text-destructive"
											}`}
										>
											{phoneVerifyMessage.type === "success" ? (
												<CheckCircle className="h-4 w-4" />
											) : (
												<AlertCircle className="h-4 w-4" />
											)}
											{phoneVerifyMessage.text}
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Notification Channels */}
					<Card className="glass-card">
						<CardHeader>
							<CardTitle>Notification Channels</CardTitle>
							<CardDescription>
								Choose how you want to receive notifications
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Push Notifications */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
										<Bell className="h-5 w-5 text-primary" />
									</div>
									<div>
										<Label htmlFor="push" className="text-base">
											Push Notifications
										</Label>
										<p className="text-sm text-muted-foreground">
											Real-time notifications in the app
										</p>
									</div>
								</div>
								<Switch
									id="push"
									checked={preferences.pushEnabled}
									onCheckedChange={(checked) =>
										updatePreference("pushEnabled", checked)
									}
								/>
							</div>

							{/* Email Notifications */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
										<Mail className="h-5 w-5 text-blue-500" />
									</div>
									<div>
										<Label htmlFor="email" className="text-base">
											Email Notifications
										</Label>
										<p className="text-sm text-muted-foreground">
											{verificationStatus.emailVerified
												? "Receive notifications via email"
												: "⚠️ Verify email to enable"}
										</p>
									</div>
								</div>
								<Switch
									id="email"
									checked={preferences.emailEnabled}
									onCheckedChange={(checked) =>
										updatePreference("emailEnabled", checked)
									}
									disabled={!verificationStatus.emailVerified}
								/>
							</div>

							{/* SMS Notifications */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
										<MessageSquare className="h-5 w-5 text-green-500" />
									</div>
									<div>
										<Label htmlFor="sms" className="text-base">
											SMS Notifications
										</Label>
										<p className="text-sm text-muted-foreground">
											{verificationStatus.phoneVerified
												? "Receive critical notifications via SMS"
												: !verificationStatus.hasPhone
												? "⚠️ Add & verify phone to enable"
												: "⚠️ Verify phone to enable"}
										</p>
									</div>
								</div>
								<Switch
									id="sms"
									checked={preferences.smsEnabled}
									onCheckedChange={(checked) =>
										updatePreference("smsEnabled", checked)
									}
									disabled={!verificationStatus.phoneVerified}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Quiet Hours */}
					<Card className="glass-card">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Quiet Hours
							</CardTitle>
							<CardDescription>
								Don&apos;t send notifications during these hours
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-4">
								<div className="flex-1">
									<Label htmlFor="quietStart" className="text-sm mb-2 block">
										Start
									</Label>
									<Input
										id="quietStart"
										type="time"
										value={preferences.quietHoursStart || ""}
										onChange={(e) =>
											updatePreference(
												"quietHoursStart",
												e.target.value || undefined
											)
										}
									/>
								</div>
								<div className="flex-1">
									<Label htmlFor="quietEnd" className="text-sm mb-2 block">
										End
									</Label>
									<Input
										id="quietEnd"
										type="time"
										value={preferences.quietHoursEnd || ""}
										onChange={(e) =>
											updatePreference(
												"quietHoursEnd",
												e.target.value || undefined
											)
										}
									/>
								</div>
							</div>
							<p className="text-xs text-muted-foreground mt-2">
								Leave empty to disable quiet hours
							</p>
						</CardContent>
					</Card>

					{/* Save Button */}
					<div className="flex justify-end">
						<Button
							variant="gradient"
							onClick={handleSave}
							disabled={isSaving}
							className="min-w-[140px]"
						>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : saved ? (
								<>
									<Check className="mr-2 h-4 w-4" />
									Saved!
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Save Changes
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
