import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
        return 'Just now'
    } else if (minutes < 60) {
        return `${minutes}m ago`
    } else if (hours < 24) {
        return `${hours}h ago`
    } else if (days < 7) {
        return `${days}d ago`
    } else {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
}

export function getNotificationIcon(type: string): string {
    switch (type) {
        case 'SUCCESS':
            return '✅'
        case 'WARNING':
            return '⚠️'
        case 'ERROR':
            return '❌'
        case 'SYSTEM':
            return '🔔'
        case 'INFO':
        default:
            return 'ℹ️'
    }
}

export function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'HIGH':
            return 'text-red-500 dark:text-red-400'
        case 'MEDIUM':
            return 'text-yellow-500 dark:text-yellow-400'
        case 'LOW':
        default:
            return 'text-green-500 dark:text-green-400'
    }
}
