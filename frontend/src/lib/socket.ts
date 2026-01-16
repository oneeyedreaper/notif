'use client'

import { io, Socket } from 'socket.io-client'
import { Notification } from './api'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class SocketClient {
    private socket: Socket | null = null
    private token: string | null = null

    connect(token: string) {
        // If already connected with same token, skip
        if (this.socket?.connected && this.token === token) {
            return
        }

        // Disconnect existing socket if any
        if (this.socket) {
            this.socket.disconnect()
        }

        this.token = token
        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        })

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected')
        })

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected')
        })

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message)
        })
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners()
            this.socket.disconnect()
            this.socket = null
            this.token = null
        }
    }

    on<T>(event: string, callback: (data: T) => void) {
        if (this.socket) {
            this.socket.on(event, callback)
        }
    }

    off<T>(event: string, callback: (data: T) => void) {
        if (this.socket) {
            this.socket.off(event, callback)
        }
    }

    emit(event: string, data?: unknown) {
        if (this.socket?.connected) {
            this.socket.emit(event, data)
        }
    }

    markAsRead(notificationId: string) {
        this.emit('notification:mark-read', { notificationId })
    }

    markAllAsRead() {
        this.emit('notification:mark-all-read')
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false
    }
}

export const socketClient = new SocketClient()

// Socket event types
export interface NewNotificationEvent {
    notification: Notification
}

export interface ReadNotificationEvent {
    id: string
}

export interface UnreadCountUpdateEvent {
    unreadCount: number
}
