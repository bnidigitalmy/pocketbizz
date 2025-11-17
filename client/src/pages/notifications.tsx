import { Bell, CheckCircle, AlertCircle, Info, Package, DollarSign, ShoppingCart, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  userId: string;
  type: "order" | "payment" | "stock" | "reminder" | "delivery" | "booking" | "system";
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  message: string;
  read: number;
  actionUrl?: string;
  metadata?: string;
  createdAt: string;
  readAt?: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refetch every 30 seconds for near real-time updates
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("POST", `/api/notifications/${notificationId}/mark-read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notifications/mark-all-read", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications.filter(n => n.read === 0).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (notification.read === 0) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
      case 'booking':
        return Package;
      case 'payment':
        return DollarSign;
      case 'stock':
        return AlertCircle;
      case 'reminder':
      case 'system':
        return Info;
      case 'delivery':
        return Truck;
      default:
        return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'medium':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Penting</Badge>;
      case 'high':
        return <Badge className="text-xs bg-blue-500">Baru</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifikasi</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Memuatkan...' : unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi telah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Tandakan Semua Dibaca
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-pulse" />
            <p className="text-gray-600">Memuatkan notifikasi...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tiada Notifikasi</h3>
            <p className="text-gray-600">
              Notifikasi akan muncul di sini bila ada update penting
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Urgent Notifications */}
          {notifications.filter(n => n.priority === 'urgent').length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                URGENT ({notifications.filter(n => n.priority === 'urgent').length})
              </h2>
              {notifications
                .filter(n => n.priority === 'urgent')
                .map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <Card
                      key={notification.id}
                      className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                        notification.read === 0 ? 'border-l-4 border-l-red-500' : ''
                      } ${getPriorityColor(notification.priority)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{notification.title}</h3>
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p className="text-sm mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                          {notification.read === 0 && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* New/High Priority Notifications */}
          {notifications.filter(n => n.priority === 'high' && n.read === 0).length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                BARU ({notifications.filter(n => n.priority === 'high' && n.read === 0).length})
              </h2>
              {notifications
                .filter(n => n.priority === 'high' && n.read === 0)
                .map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <Card
                      key={notification.id}
                      className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                        notification.read === 0 ? 'border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{notification.title}</h3>
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                          {notification.read === 0 && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* Earlier/Read Notifications */}
          {notifications.filter(n => n.read === 1 || n.priority === 'medium' || n.priority === 'low').length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">
                TERDAHULU ({notifications.filter(n => n.read === 1 || n.priority === 'medium' || n.priority === 'low').length})
              </h2>
              {notifications
                .filter(n => n.read === 1 || n.priority === 'medium' || n.priority === 'low')
                .map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <Card
                      key={notification.id}
                      className="mb-3 cursor-pointer transition-all hover:shadow-sm opacity-75"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm text-gray-700">{notification.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Tip: Notifikasi Pintar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          <p>
            Sistem akan notify anda untuk perkara penting seperti:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Tempahan baru masuk</li>
            <li>Pembayaran diterima</li>
            <li>Stok bahan rendah</li>
            <li>Pengingat produksi esok</li>
            <li>Order perlu siap hari ini</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
