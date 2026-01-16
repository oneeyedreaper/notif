"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Template, CreateTemplateData } from "@/lib/api";
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
	Mail,
	MessageSquare,
	Plus,
	Pencil,
	Trash2,
	Eye,
	Send,
	X,
	FileText,
	AlertCircle,
	CheckCircle,
} from "lucide-react";

type TemplateChannel = "EMAIL" | "SMS";

interface TemplateFormData {
	name: string;
	channel: TemplateChannel;
	subject: string;
	body: string;
	variables: string;
}

export default function TemplatesPage() {
	const router = useRouter();
	const { isAuthenticated, isLoading: authLoading } = useAuth();

	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
	const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
	const [renderedPreview, setRenderedPreview] = useState<{
		subject?: string;
		body: string;
	} | null>(null);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [formError, setFormError] = useState<string | null>(null);

	const [formData, setFormData] = useState<TemplateFormData>({
		name: "",
		channel: "EMAIL",
		subject: "",
		body: "",
		variables: "",
	});

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, authLoading, router]);

	useEffect(() => {
		if (isAuthenticated) {
			fetchTemplates();
		}
	}, [isAuthenticated]);

	const fetchTemplates = async () => {
		try {
			setLoading(true);
			const { templates } = await api.getTemplates();
			setTemplates(templates);
		} catch (error) {
			console.error("Failed to fetch templates:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);

		try {
			const data: CreateTemplateData = {
				name: formData.name,
				channel: formData.channel,
				body: formData.body,
				...(formData.channel === "EMAIL" && { subject: formData.subject }),
				...(formData.variables && {
					variables: formData.variables.split(",").map((v) => v.trim()),
				}),
			};

			if (editingTemplate) {
				await api.updateTemplate(editingTemplate.id, data);
				setMessage({ type: "success", text: "Template updated successfully!" });
			} else {
				await api.createTemplate(data);
				setMessage({ type: "success", text: "Template created successfully!" });
			}

			resetForm();
			fetchTemplates();
		} catch (error: any) {
			setFormError(error.message || "Failed to save template");
		}
	};

	const handleEdit = (template: Template) => {
		setEditingTemplate(template);
		setFormData({
			name: template.name,
			channel: template.channel,
			subject: template.subject || "",
			body: template.body,
			variables: template.variables.join(", "),
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this template?")) return;

		try {
			await api.deleteTemplate(id);
			setMessage({ type: "success", text: "Template deleted successfully!" });
			fetchTemplates();
		} catch (error: any) {
			setMessage({
				type: "error",
				text: error.message || "Failed to delete template",
			});
		}
	};

	const handlePreview = (template: Template) => {
		setPreviewTemplate(template);
		const vars: Record<string, string> = {};
		template.variables.forEach((v) => {
			vars[v] = `[Sample ${v}]`;
		});
		setPreviewVars(vars);
		setRenderedPreview(null);
		setShowPreview(true);
	};

	const renderPreview = async () => {
		if (!previewTemplate) return;

		try {
			const { template } = await api.previewTemplate(
				previewTemplate.id,
				previewVars
			);
			setRenderedPreview({
				subject: (template as any).renderedSubject,
				body: (template as any).renderedBody,
			});
		} catch (error: any) {
			setMessage({
				type: "error",
				text: error.message || "Failed to preview template",
			});
		}
	};

	const resetForm = () => {
		setShowForm(false);
		setEditingTemplate(null);
		setFormError(null);
		setFormData({
			name: "",
			channel: "EMAIL",
			subject: "",
			body: "",
			variables: "",
		});
	};

	if (authLoading || loading) {
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
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-12">
			<div className="container max-w-6xl mx-auto px-4">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
							Templates
						</h1>
						<p className="text-muted-foreground mt-1">
							Manage your email and SMS notification templates
						</p>
					</div>
					<Button onClick={() => setShowForm(true)} className="gap-2">
						<Plus className="h-4 w-4" />
						New Template
					</Button>
				</div>

				{message && (
					<div
						className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
							message.type === "success"
								? "bg-green-500/10 text-green-500"
								: "bg-destructive/10 text-destructive"
						}`}
					>
						{message.type === "success" ? (
							<CheckCircle className="h-5 w-5" />
						) : (
							<AlertCircle className="h-5 w-5" />
						)}
						{message.text}
						<button onClick={() => setMessage(null)} className="ml-auto">
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				{/* Template Form Modal */}
				{showForm && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
							<CardHeader>
								<CardTitle>
									{editingTemplate ? "Edit Template" : "Create Template"}
								</CardTitle>
								<CardDescription>
									{editingTemplate
										? "Update your notification template"
										: "Create a new email or SMS template"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="name">Template Name</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) =>
												setFormData({ ...formData, name: e.target.value })
											}
											placeholder="e.g., Welcome Email"
											required
										/>
									</div>

									<div className="space-y-2">
										<Label>Channel</Label>
										<div className="flex gap-2">
											<Button
												type="button"
												variant={
													formData.channel === "EMAIL" ? "default" : "outline"
												}
												className="flex-1"
												onClick={() =>
													setFormData({ ...formData, channel: "EMAIL" })
												}
											>
												<Mail className="h-4 w-4 mr-2" />
												Email
											</Button>
											<Button
												type="button"
												variant={
													formData.channel === "SMS" ? "default" : "outline"
												}
												className="flex-1"
												onClick={() =>
													setFormData({ ...formData, channel: "SMS" })
												}
											>
												<MessageSquare className="h-4 w-4 mr-2" />
												SMS
											</Button>
										</div>
									</div>

									{formData.channel === "EMAIL" && (
										<div className="space-y-2">
											<Label htmlFor="subject">Subject</Label>
											<Input
												id="subject"
												value={formData.subject}
												onChange={(e) =>
													setFormData({ ...formData, subject: e.target.value })
												}
												placeholder="e.g., Welcome to {{appName}}, {{name}}!"
												required
											/>
										</div>
									)}

									<div className="space-y-2">
										<Label htmlFor="body">Body</Label>
										<textarea
											id="body"
											value={formData.body}
											onChange={(e) =>
												setFormData({ ...formData, body: e.target.value })
											}
											placeholder={
												formData.channel === "EMAIL"
													? "<h1>Hello {{name}}</h1>\n<p>Welcome to our platform!</p>"
													: "Hi {{name}}, your verification code is {{code}}"
											}
											className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-background text-sm"
											required
										/>
										<p className="text-xs text-muted-foreground">
											Use {"{{variableName}}"} for dynamic content
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="variables">
											Variables (comma-separated)
										</Label>
										<Input
											id="variables"
											value={formData.variables}
											onChange={(e) =>
												setFormData({ ...formData, variables: e.target.value })
											}
											placeholder="e.g., name, email, code"
										/>
									</div>

									{formError && (
										<div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
											<AlertCircle className="h-4 w-4" />
											{formError}
										</div>
									)}

									<div className="flex gap-2 pt-4">
										<Button
											type="button"
											variant="outline"
											onClick={resetForm}
											className="flex-1"
										>
											Cancel
										</Button>
										<Button type="submit" className="flex-1">
											{editingTemplate ? "Update" : "Create"} Template
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Preview Modal */}
				{showPreview && previewTemplate && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											<Eye className="h-5 w-5" />
											Preview: {previewTemplate.name}
										</CardTitle>
										<CardDescription>
											Fill in sample values to see how your template will render
										</CardDescription>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowPreview(false)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Variables Input */}
								{previewTemplate.variables.length > 0 && (
									<div className="space-y-3">
										<Label>Sample Variables</Label>
										<div className="grid grid-cols-2 gap-3">
											{previewTemplate.variables.map((v) => (
												<div key={v} className="space-y-1">
													<Label className="text-xs text-muted-foreground">{`{{${v}}}`}</Label>
													<Input
														value={previewVars[v] || ""}
														onChange={(e) =>
															setPreviewVars({
																...previewVars,
																[v]: e.target.value,
															})
														}
														placeholder={`Enter ${v}`}
													/>
												</div>
											))}
										</div>
										<Button onClick={renderPreview} className="w-full gap-2">
											<Eye className="h-4 w-4" />
											Render Preview
										</Button>
									</div>
								)}

								{/* Rendered Preview */}
								{renderedPreview && (
									<div className="space-y-4 pt-4 border-t">
										<h3 className="font-semibold">Rendered Output</h3>
										{previewTemplate.channel === "EMAIL" &&
											renderedPreview.subject && (
												<div className="space-y-1">
													<Label className="text-xs text-muted-foreground">
														Subject
													</Label>
													<div className="p-3 bg-muted rounded-lg">
														{renderedPreview.subject}
													</div>
												</div>
											)}
										<div className="space-y-1">
											<Label className="text-xs text-muted-foreground">
												Body
											</Label>
											<div className="p-4 bg-muted rounded-lg">
												{previewTemplate.channel === "EMAIL" ? (
													<div
														className="prose prose-sm max-w-none dark:prose-invert"
														dangerouslySetInnerHTML={{
															__html: renderedPreview.body,
														}}
													/>
												) : (
													<p className="whitespace-pre-wrap">
														{renderedPreview.body}
													</p>
												)}
											</div>
										</div>
									</div>
								)}

								{/* Original Template */}
								<div className="space-y-4 pt-4 border-t">
									<h3 className="font-semibold text-muted-foreground">
										Original Template
									</h3>
									{previewTemplate.channel === "EMAIL" &&
										previewTemplate.subject && (
											<div className="space-y-1">
												<Label className="text-xs text-muted-foreground">
													Subject
												</Label>
												<div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
													{previewTemplate.subject}
												</div>
											</div>
										)}
									<div className="space-y-1">
										<Label className="text-xs text-muted-foreground">
											Body
										</Label>
										<div className="p-3 bg-muted/50 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
											{previewTemplate.body}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Templates List */}
				{templates.length === 0 ? (
					<Card className="text-center py-12">
						<CardContent>
							<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
							<p className="text-muted-foreground mb-4">
								Create your first email or SMS template to get started
							</p>
							<Button onClick={() => setShowForm(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Create Template
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{templates.map((template) => (
							<Card
								key={template.id}
								className="hover:border-primary/50 transition-colors"
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-2">
											{template.channel === "EMAIL" ? (
												<div className="p-2 rounded-lg bg-blue-500/10">
													<Mail className="h-4 w-4 text-blue-500" />
												</div>
											) : (
												<div className="p-2 rounded-lg bg-green-500/10">
													<MessageSquare className="h-4 w-4 text-green-500" />
												</div>
											)}
											<div>
												<CardTitle className="text-base">
													{template.name}
												</CardTitle>
												<CardDescription className="text-xs">
													{template.channel} • {template.variables.length}{" "}
													variables
												</CardDescription>
											</div>
										</div>
										<div
											className={`px-2 py-1 rounded text-xs ${
												template.isActive
													? "bg-green-500/10 text-green-500"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{template.isActive ? "Active" : "Inactive"}
										</div>
									</div>
								</CardHeader>
								<CardContent>
									{template.channel === "EMAIL" && template.subject && (
										<div className="mb-2">
											<p className="text-xs text-muted-foreground">Subject</p>
											<p className="text-sm truncate">{template.subject}</p>
										</div>
									)}
									<div className="mb-4">
										<p className="text-xs text-muted-foreground">
											Body Preview
										</p>
										<p className="text-sm text-muted-foreground truncate">
											{template.body.replace(/<[^>]*>/g, "").substring(0, 100)}
											...
										</p>
									</div>
									{template.variables.length > 0 && (
										<div className="flex flex-wrap gap-1 mb-4">
											{template.variables.map((v) => (
												<span
													key={v}
													className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
												>
													{`{{${v}}}`}
												</span>
											))}
										</div>
									)}
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											className="flex-1"
											onClick={() => handlePreview(template)}
										>
											<Eye className="h-4 w-4 mr-1" />
											Preview
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleEdit(template)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive hover:text-destructive"
											onClick={() => handleDelete(template.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
