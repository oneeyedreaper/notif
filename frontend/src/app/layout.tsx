import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "NotifyHub - Smart Notification System",
	description:
		"A comprehensive notification system with email/SMS integration and real-time updates",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<NotificationProvider>
							<div className="min-h-screen flex flex-col">
								<Header />
								<main className="flex-1">{children}</main>
							</div>
						</NotificationProvider>
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
