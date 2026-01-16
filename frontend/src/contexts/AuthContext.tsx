"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { api, User } from "@/lib/api";
import { socketClient } from "@/lib/socket";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		password: string,
		name: string,
		phone?: string
	) => Promise<string>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const initAuth = async () => {
			const token = localStorage.getItem("token");
			if (token) {
				try {
					const { user } = await api.getMe();
					setUser(user);
					socketClient.connect(token);
				} catch {
					localStorage.removeItem("token");
				}
			}
			setIsLoading(false);
		};

		initAuth();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const { user, token } = await api.login({ email, password });
		localStorage.setItem("token", token);
		setUser(user);
		socketClient.connect(token);
	}, []);

	const register = useCallback(
		async (
			email: string,
			password: string,
			name: string,
			phone?: string
		): Promise<string> => {
			const response = await api.register({ email, password, name, phone });
			// No token returned - user must verify email first
			return response.message;
		},
		[]
	);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		setUser(null);
		socketClient.disconnect();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
