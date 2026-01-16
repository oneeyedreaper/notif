'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, CheckCheck, Filter, Loader2, Trash2 } from 'lucide-react'

type FilterType = 'all' | 'unread' | 'read'
type TypeFilter = 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM'

export default function NotificationsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    currentPage,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const [filterRead, setFilterRead] = useState<FilterType>('all')
  const [filterType, setFilterType] = useState<TypeFilter>('ALL')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const filteredNotifications = notifications.filter((n) => {
    if (filterRead === 'unread' && n.isRead) return false
    if (filterRead === 'read' && !n.isRead) return false
    if (filterType !== 'ALL' && n.type !== filterType) return false
    return true
  })

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(currentPage + 1)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'You\'re all caught up!'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterType === 'ALL' ? 'All types' : filterType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType('ALL')}>
                  All types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('INFO')}>
                  ℹ️ Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('SUCCESS')}>
                  ✅ Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('WARNING')}>
                  ⚠️ Warning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('ERROR')}>
                  ❌ Error
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('SYSTEM')}>
                  🔔 System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Read Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {filterRead === 'all' && 'All'}
                  {filterRead === 'unread' && 'Unread'}
                  {filterRead === 'read' && 'Read'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterRead('all')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead('unread')}>
                  Unread only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRead('read')}>
                  Read only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground text-sm">
                {notifications.length === 0
                  ? "You don't have any notifications yet"
                  : 'No notifications match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
