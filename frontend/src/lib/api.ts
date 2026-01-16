const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
    method?: string
    body?: unknown
    headers?: Record<string, string>
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('token')
    }

    private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options

        const token = this.getToken()

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...headers,
            },
        }

        if (body) {
            config.body = JSON.stringify(body)
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config)

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'An error occurred' }))
            throw new Error(error.error || 'An error occurred')
        }

        return response.json()
    }

    // Auth
    async register(data: { email: string; password: string; name: string; phone?: string }) {
        return this.request<{ user: User; token: string }>('/api/auth/register', {
            method: 'POST',
            body: data,
        })
    }

    async login(data: { email: string; password: string }) {
        return this.request<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: data,
        })
    }

    async getMe() {
        return this.request<{ user: User }>('/api/auth/me')
    }

    async updateProfile(data: { name?: string; phone?: string | null }) {
        return this.request<{ user: User }>('/api/auth/profile', {
            method: 'PATCH',
            body: data,
        })
    }

    async changePassword(data: { currentPassword: string; newPassword: string }) {
        return this.request<{ message: string }>('/api/auth/change-password', {
            method: 'POST',
            body: data,
        })
    }

    async deleteAccount(password: string) {
        return this.request<{ message: string }>('/api/auth/delete-account', {
            method: 'DELETE',
            body: { password },
        })
    }

    // Verification
    async verifyEmail(token: string) {
        return this.request<{ message: string }>(`/api/verification/email/${token}`)
    }

    async resendVerificationEmail() {
        return this.request<{ message: string }>('/api/verification/resend-email', {
            method: 'POST',
        })
    }

    async sendPhoneCode() {
        return this.request<{ message: string }>('/api/verification/send-phone-code', {
            method: 'POST',
        })
    }

    async verifyPhone(code: string) {
        return this.request<{ message: string }>('/api/verification/verify-phone', {
            method: 'POST',
            body: { code },
        })
    }

    async getVerificationStatus() {
        return this.request<{ emailVerified: boolean; phoneVerified: boolean; hasPhone: boolean }>('/api/verification/status')
    }

    // Notifications
    async getNotifications(params: NotificationParams = {}) {
        const query = new URLSearchParams()
        if (params.page) query.set('page', String(params.page))
        if (params.limit) query.set('limit', String(params.limit))
        if (params.isRead) query.set('isRead', params.isRead)
        if (params.type) query.set('type', params.type)
        if (params.priority) query.set('priority', params.priority)

        return this.request<NotificationListResponse>(`/api/notifications?${query}`)
    }

    async getUnreadCount() {
        return this.request<{ unreadCount: number }>('/api/notifications/unread-count')
    }

    async createNotification(data: CreateNotificationData) {
        return this.request<{ notification: Notification }>('/api/notifications', {
            method: 'POST',
            body: data,
        })
    }

    async markAsRead(id: string) {
        return this.request<{ notification: Notification }>(`/api/notifications/${id}/read`, {
            method: 'PATCH',
        })
    }

    async markAllAsRead() {
        return this.request<{ count: number }>('/api/notifications/read-all', {
            method: 'PATCH',
        })
    }

    async deleteNotification(id: string) {
        return this.request<{ message: string }>(`/api/notifications/${id}`, {
            method: 'DELETE',
        })
    }

    // Templates
    async getTemplates() {
        return this.request<{ templates: Template[] }>('/api/templates')
    }

    async createTemplate(data: CreateTemplateData) {
        return this.request<{ template: Template }>('/api/templates', {
            method: 'POST',
            body: data,
        })
    }

    async updateTemplate(id: string, data: Partial<CreateTemplateData>) {
        return this.request<{ template: Template }>(`/api/templates/${id}`, {
            method: 'PUT',
            body: data,
        })
    }

    async deleteTemplate(id: string) {
        return this.request<{ message: string }>(`/api/templates/${id}`, {
            method: 'DELETE',
        })
    }

    async previewTemplate(id: string, variables: Record<string, string>) {
        return this.request<{ template: Template & { renderedSubject: string; renderedBody: string } }>(
            `/api/templates/${id}/preview`,
            {
                method: 'POST',
                body: { variables },
            }
        )
    }

    // Preferences
    async getPreferences() {
        return this.request<{ preferences: UserPreference }>('/api/preferences')
    }

    async updatePreferences(data: Partial<UserPreference>) {
        return this.request<{ preferences: UserPreference }>('/api/preferences', {
            method: 'PUT',
            body: data,
        })
    }
}

export const api = new ApiClient(API_URL)

// Types
export interface User {
    id: string
    email: string
    name: string
    phone?: string
    emailVerified?: boolean
    phoneVerified?: boolean
    createdAt: string
}

export interface Notification {
    id: string
    userId: string
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM'
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    title: string
    message: string
    actionUrl?: string
    metadata?: Record<string, unknown>
    isRead: boolean
    readAt?: string
    createdAt: string
}

export interface NotificationParams {
    page?: number
    limit?: number
    isRead?: 'true' | 'false' | 'all'
    type?: string
    priority?: string
}

export interface NotificationListResponse {
    notifications: Notification[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
}

export interface CreateNotificationData {
    title: string
    message: string
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    actionUrl?: string
    metadata?: Record<string, unknown>
}

export interface Template {
    id: string
    name: string
    channel: 'EMAIL' | 'SMS'
    subject?: string
    body: string
    variables: string[]
    isActive: boolean
    createdAt: string
}

export interface CreateTemplateData {
    name: string
    channel: 'EMAIL' | 'SMS'
    subject?: string
    body: string
    variables?: string[]
}

export interface UserPreference {
    id: string
    userId: string
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    emailFrequency: 'instant' | 'daily' | 'weekly'
    quietHoursStart?: string
    quietHoursEnd?: string
}
