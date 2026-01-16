'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, Notification } from '@/lib/api'
import { socketClient, NewNotificationEvent, ReadNotificationEvent, UnreadCountUpdateEvent } from '@/lib/socket'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  currentPage: number
  fetchNotifications: (page?: number, reset?: boolean) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshUnreadCount: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { unreadCount } = await api.getUnreadCount()
      setUnreadCount(unreadCount)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [isAuthenticated])

  const fetchNotifications = useCallback(async (page = 1, reset = false) => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    try {
      const response = await api.getNotifications({ page, limit: 20 })
      
      if (reset) {
        setNotifications(response.notifications)
      } else {
        setNotifications(prev => [...prev, ...response.notifications])
      }
      
      setCurrentPage(page)
      setHasMore(response.pagination.hasMore)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      // Note: unreadCount will be updated via socket event from backend
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      // Note: unreadCount will be updated via socket event from backend
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      // Note: unreadCount will be updated via socket event from backend
    } catch (error: any) {
      // If notification was already deleted (404), still remove from local state
      if (error?.response?.status === 404 || error?.message?.includes('404')) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      } else {
        console.error('Failed to delete notification:', error)
      }
    }
  }, [])

  // Set up socket listeners
  useEffect(() => {
    if (!isAuthenticated) return

    const handleNewNotification = (data: NewNotificationEvent) => {
      setNotifications(prev => [data.notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    const handleReadNotification = (data: ReadNotificationEvent) => {
      setNotifications(prev =>
        prev.map(n => (n.id === data.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
    }

    const handleReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
    }

    const handleDeleteAll = () => {
      setNotifications([])
      setUnreadCount(0)
    }

    const handleUnreadCountUpdate = (data: UnreadCountUpdateEvent) => {
      setUnreadCount(data.unreadCount)
    }

    socketClient.on('notification:new', handleNewNotification)
    socketClient.on('notification:read', handleReadNotification)
    socketClient.on('notification:read-all', handleReadAll)
    socketClient.on('notification:delete-all', handleDeleteAll)
    socketClient.on('unread-count:update', handleUnreadCountUpdate)

    return () => {
      socketClient.off('notification:new', handleNewNotification)
      socketClient.off('notification:read', handleReadNotification)
      socketClient.off('notification:read-all', handleReadAll)
      socketClient.off('notification:delete-all', handleDeleteAll)
      socketClient.off('unread-count:update', handleUnreadCountUpdate)
    }
  }, [isAuthenticated])

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true)
      refreshUnreadCount()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuthenticated, fetchNotifications, refreshUnreadCount])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        currentPage,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
