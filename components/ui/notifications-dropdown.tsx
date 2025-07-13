'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle, Clock, AlertCircle, Info, FileText, Upload, Download, Slack, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationsSkeleton } from './skeleton-loaders';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  data?: any;
}

interface NotificationsDropdownProps {
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
}

export function NotificationsDropdown({ 
  onMarkAsRead, 
  onMarkAllAsRead 
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data || []);
      } else {
        console.error('Failed to fetch notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      if (onMarkAsRead) {
        await onMarkAsRead(id);
      } else {
        // Default implementation
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId: id }),
        });
        
        if (response.ok) {
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === id 
                ? { ...notification, read_at: new Date().toISOString() } 
                : notification
            )
          );
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (onMarkAllAsRead) {
        await onMarkAllAsRead();
      } else {
        // Default implementation
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ markAllAsRead: true }),
        });
        
        if (response.ok) {
          const now = new Date().toISOString();
          setNotifications(prev => 
            prev.map(notification => ({ ...notification, read_at: now }))
          );
          toast.success('All notifications marked as read');
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'unread') {
      return notifications.filter(notification => !notification.read_at);
    }
    return notifications;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'summary_ready':
      case 'summary_completed':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'file_uploaded':
      case 'upload_complete':
        return <Upload className="h-5 w-5 text-green-500" />;
      case 'export_complete':
      case 'export_triggered':
        return <Download className="h-5 w-5 text-purple-500" />;
      case 'slack_connected':
        return <Slack className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      case 'welcome':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs p-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs h-8"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all" className="text-sm">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-sm">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
            <NotificationsContent 
              notifications={getFilteredNotifications()}
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              getNotificationIcon={getNotificationIcon}
              getTimeAgo={getTimeAgo}
            />
          </TabsContent>
          
          <TabsContent value="unread" className="m-0">
            <NotificationsContent 
              notifications={getFilteredNotifications()}
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              getNotificationIcon={getNotificationIcon}
              getTimeAgo={getTimeAgo}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationsContentProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  getNotificationIcon: (type: string) => React.ReactNode;
  getTimeAgo: (dateString: string) => string;
}

function NotificationsContent({ 
  notifications, 
  isLoading, 
  onMarkAsRead,
  getNotificationIcon,
  getTimeAgo
}: NotificationsContentProps) {
  if (isLoading) {
    return <div className="p-4"><NotificationsSkeleton /></div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bell className="h-10 w-10 text-gray-300 mb-2" />
        <h4 className="text-sm font-medium text-gray-700">No notifications</h4>
        <p className="text-xs text-gray-500">You're all caught up!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`p-4 border-b hover:bg-gray-50 cursor-pointer flex items-start space-x-3 ${
              !notification.read_at ? 'bg-blue-50' : ''
            }`}
            onClick={() => onMarkAsRead(notification.id)}
          >
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notification.title}
                </p>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {getTimeAgo(notification.created_at)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>
            {!notification.read_at && (
              <div className="flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollArea>
  );
}
