'use client'

import { Notification } from '@/lib/api'
import { cn, formatDate, getNotificationIcon, getPriorityColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Check, Trash2, ExternalLink } from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const typeColors = {
    INFO: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    SUCCESS: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    WARNING: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    ERROR: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    SYSTEM: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
        notification.isRead
          ? 'bg-card'
          : 'notification-unread',
        typeColors[notification.type]
      )}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'text-sm font-semibold truncate',
              !notification.isRead && 'text-foreground'
            )}>
              {notification.title}
            </h4>
            <span className={cn('text-xs font-medium', getPriorityColor(notification.priority))}>
              {notification.priority}
            </span>
          </div>

          <p className={cn(
            'text-sm text-muted-foreground',
            compact ? 'line-clamp-1' : 'line-clamp-2'
          )}>
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(notification.createdAt)}
            </span>

            {notification.actionUrl && (
              <a
                href={notification.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          compact && 'absolute right-2 top-2'
        )}>
          {!notification.isRead && onMarkAsRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse-ring" />
      )}
    </div>
  )
}
