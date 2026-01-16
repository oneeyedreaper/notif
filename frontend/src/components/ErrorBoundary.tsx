"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-destructive/5 rounded-lg border border-destructive/20">
					<div className="p-3 rounded-full bg-destructive/10 mb-4">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>
					<h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
					<p className="text-muted-foreground text-sm text-center mb-4 max-w-md">
						An unexpected error occurred. Please try refreshing the page or
						click the button below.
					</p>
					{this.state.error && (
						<p className="text-xs text-muted-foreground font-mono mb-4 px-4 py-2 bg-muted rounded">
							{this.state.error.message}
						</p>
					)}
					<Button
						onClick={this.handleReset}
						variant="outline"
						className="gap-2"
					>
						<RefreshCw className="h-4 w-4" />
						Try Again
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
