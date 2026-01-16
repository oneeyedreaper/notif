"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	User,
	Phone,
	Lock,
	Save,
	AlertCircle,
	CheckCircle,
	Trash2,
} from "lucide-react";

export default function ProfilePage() {
	const router = useRouter();
	const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

	// Profile form state
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileMessage, setProfileMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	// Password form state
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [passwordMessage, setPasswordMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	// Delete account state
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteMessage, setDeleteMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [showDeletedModal, setShowDeletedModal] = useState(false);
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		if (!authLoading && !isAuthenticated && !showDeletedModal) {
			router.push("/login");
		}
	}, [isAuthenticated, authLoading, router, showDeletedModal]);

	useEffect(() => {
		if (user) {
			setName(user.name || "");
			setPhone(user.phone || "");
		}
	}, [user]);

	const handleProfileUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setProfileLoading(true);
		setProfileMessage(null);

		try {
			await api.updateProfile({ name, phone: phone || null });
			setProfileMessage({
				type: "success",
				text: "Profile updated successfully!",
			});
		} catch (error: any) {
			setProfileMessage({
				type: "error",
				text: error.message || "Failed to update profile",
			});
		} finally {
			setProfileLoading(false);
		}
	};

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordLoading(true);
		setPasswordMessage(null);

		if (newPassword !== confirmPassword) {
			setPasswordMessage({ type: "error", text: "New passwords do not match" });
			setPasswordLoading(false);
			return;
		}

		if (newPassword.length < 6) {
			setPasswordMessage({
				type: "error",
				text: "Password must be at least 6 characters",
			});
			setPasswordLoading(false);
			return;
		}

		try {
			await api.changePassword({ currentPassword, newPassword });
			setPasswordMessage({
				type: "success",
				text: "Password changed successfully!",
			});
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error: any) {
			setPasswordMessage({
				type: "error",
				text: error.message || "Failed to change password",
			});
		} finally {
			setPasswordLoading(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!deletePassword) {
			setDeleteMessage({ type: "error", text: "Please enter your password" });
			return;
		}

		setDeleteLoading(true);
		setDeleteMessage(null);

		try {
			await api.deleteAccount(deletePassword);
			setShowDeletedModal(true);

			// Start countdown
			let count = 5;
			const interval = setInterval(() => {
				count -= 1;
				setCountdown(count);
				if (count <= 0) {
					clearInterval(interval);
					logout();
					router.push("/");
				}
			}, 1000);
		} catch (error: any) {
			setDeleteMessage({
				type: "error",
				text: error.message || "Failed to delete account",
			});
			setDeleteLoading(false);
		}
	};

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<>
			<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12">
				<div className="container max-w-2xl mx-auto px-4 space-y-8">
					<div className="text-center">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
							Profile Settings
						</h1>
						<p className="text-muted-foreground mt-2">
							Manage your account information
						</p>
					</div>

					{/* Profile Information Card */}
					<Card className="backdrop-blur-sm bg-card/80 border-border/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5 text-primary" />
								Profile Information
							</CardTitle>
							<CardDescription>
								Update your name and contact details
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleProfileUpdate} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={user?.email || ""}
										disabled
										className="bg-muted/50"
									/>
									<p className="text-xs text-muted-foreground">
										Email cannot be changed
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="name">Full Name</Label>
									<Input
										id="name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Your full name"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="phone" className="flex items-center gap-2">
										<Phone className="h-4 w-4" />
										Phone Number (optional)
									</Label>
									<Input
										id="phone"
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="+1 234 567 8900"
									/>
									<p className="text-xs text-muted-foreground">
										Used for SMS notifications
									</p>
								</div>

								{profileMessage && (
									<div
										className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
											profileMessage.type === "success"
												? "bg-green-500/10 text-green-500"
												: "bg-destructive/10 text-destructive"
										}`}
									>
										{profileMessage.type === "success" ? (
											<CheckCircle className="h-4 w-4" />
										) : (
											<AlertCircle className="h-4 w-4" />
										)}
										{profileMessage.text}
									</div>
								)}

								<Button
									type="submit"
									disabled={profileLoading}
									className="w-full"
								>
									{profileLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
											Saving...
										</>
									) : (
										<>
											<Save className="h-4 w-4 mr-2" />
											Save Changes
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Change Password Card */}
					<Card className="backdrop-blur-sm bg-card/80 border-border/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Lock className="h-5 w-5 text-primary" />
								Change Password
							</CardTitle>
							<CardDescription>Update your account password</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handlePasswordChange} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="currentPassword">Current Password</Label>
									<Input
										id="currentPassword"
										type="password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										placeholder="••••••••"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="newPassword">New Password</Label>
									<Input
										id="newPassword"
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="••••••••"
										required
									/>
									<p className="text-xs text-muted-foreground">
										Must be at least 6 characters
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm New Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="••••••••"
										required
									/>
								</div>

								{passwordMessage && (
									<div
										className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
											passwordMessage.type === "success"
												? "bg-green-500/10 text-green-500"
												: "bg-destructive/10 text-destructive"
										}`}
									>
										{passwordMessage.type === "success" ? (
											<CheckCircle className="h-4 w-4" />
										) : (
											<AlertCircle className="h-4 w-4" />
										)}
										{passwordMessage.text}
									</div>
								)}

								<Button
									type="submit"
									disabled={passwordLoading}
									variant="outline"
									className="w-full"
								>
									{passwordLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
											Changing...
										</>
									) : (
										<>
											<Lock className="h-4 w-4 mr-2" />
											Change Password
										</>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Delete Account Card */}
					<Card className="backdrop-blur-sm bg-card/80 border-destructive/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-destructive">
								<Trash2 className="h-5 w-5" />
								Delete Account
							</CardTitle>
							<CardDescription>
								Permanently delete your account and all data
							</CardDescription>
						</CardHeader>
						<CardContent>
							{!showDeleteConfirm ? (
								<div className="space-y-4">
									<p className="text-sm text-muted-foreground">
										Once you delete your account, there is no going back. All
										your data including notifications, preferences, and settings
										will be permanently removed.
									</p>
									<Button
										variant="destructive"
										onClick={() => setShowDeleteConfirm(true)}
										className="w-full"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete My Account
									</Button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
										<p className="text-sm font-medium text-destructive">
											⚠️ This action cannot be undone!
										</p>
										<p className="text-sm text-muted-foreground mt-1">
											Enter your password to confirm account deletion.
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="deletePassword">Confirm Password</Label>
										<Input
											id="deletePassword"
											type="password"
											value={deletePassword}
											onChange={(e) => setDeletePassword(e.target.value)}
											placeholder="Enter your password"
										/>
									</div>

									{deleteMessage && (
										<div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive">
											<AlertCircle className="h-4 w-4" />
											{deleteMessage.text}
										</div>
									)}

									<div className="flex gap-2">
										<Button
											variant="outline"
											onClick={() => {
												setShowDeleteConfirm(false);
												setDeletePassword("");
												setDeleteMessage(null);
											}}
											className="flex-1"
										>
											Cancel
										</Button>
										<Button
											variant="destructive"
											onClick={handleDeleteAccount}
											disabled={deleteLoading || !deletePassword}
											className="flex-1"
										>
											{deleteLoading ? (
												<>
													<div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
													Deleting...
												</>
											) : (
												<>
													<Trash2 className="h-4 w-4 mr-2" />
													Confirm Delete
												</>
											)}
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Deletion Success Modal with Countdown */}
			{showDeletedModal && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center space-y-6">
						<div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
							<CheckCircle className="h-8 w-8 text-green-500" />
						</div>
						<div>
							<h2 className="text-2xl font-bold">Account Deleted</h2>
							<p className="text-muted-foreground mt-2">
								Your account has been successfully deleted.
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Redirecting to homepage in...
							</p>
							<div className="text-4xl font-bold text-primary">{countdown}</div>
						</div>
						<Button
							onClick={() => router.push("/")}
							variant="outline"
							className="w-full"
						>
							Go to Homepage Now
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
