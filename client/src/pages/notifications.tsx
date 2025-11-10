import { Bell, CheckCircle, AlertCircle, Info, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Placeholder notifications - will be replaced with real data later
const sampleNotifications = [
  {
    id: 1,
    type: 'order',
    title: 'Tempahan Baru',
    message: 'Kek Red Velvet (2kg) - Pn. Siti',
    amount: 'RM 120',
    time: '2 minit lalu',
    read: false,
    priority: 'high',
    icon: Package,
  },
  {
    id: 2,
    type: 'payment',
    title: 'Pembayaran Diterima',
    message: 'Order #ORD-1234 telah dibayar',
    amount: 'RM 85',
    time: '1 jam lalu',
    read: false,
    priority: 'normal',
    icon: DollarSign,
  },
  {
    id: 3,
    type: 'stock',
    title: 'Stok Rendah',
    message: 'Tepung Gandum tinggal 500g (min: 2kg)',
    time: '3 jam lalu',
    read: false,
    priority: 'urgent',
    icon: AlertCircle,
  },
  {
    id: 4,
    type: 'reminder',
    title: 'Pengingat',
    message: '5 tempahan perlu siap esok (15 Nov)',
    time: '5 jam lalu',
    read: true,
    priority: 'normal',
    icon: Info,
  },
  {
    id: 5,
    type: 'delivery',
    title: 'Penghantaran Selesai',
    message: 'Cupcake Coklat ke Kedai Mimi',
    time: 'Semalam',
    read: true,
    priority: 'low',
    icon: CheckCircle,
  },
];

export default function NotificationsPage() {
  const unreadCount = sampleNotifications.filter(n => !n.read).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'normal':
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
            {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi telah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm">
            Tandakan Semua Dibaca
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Urgent Notifications */}
        {sampleNotifications.filter(n => n.priority === 'urgent').length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              URGENT ({sampleNotifications.filter(n => n.priority === 'urgent').length})
            </h2>
            {sampleNotifications
              .filter(n => n.priority === 'urgent')
              .map((notification) => {
                const Icon = notification.icon;
                return (
                  <Card
                    key={notification.id}
                    className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-red-500' : ''
                    } ${getPriorityColor(notification.priority)}`}
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
                            <span>{notification.time}</span>
                            {notification.amount && (
                              <span className="font-semibold">{notification.amount}</span>
                            )}
                          </div>
                        </div>
                        {!notification.read && (
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
        {sampleNotifications.filter(n => n.priority === 'high' && !n.read).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              BARU ({sampleNotifications.filter(n => n.priority === 'high' && !n.read).length})
            </h2>
            {sampleNotifications
              .filter(n => n.priority === 'high' && !n.read)
              .map((notification) => {
                const Icon = notification.icon;
                return (
                  <Card
                    key={notification.id}
                    className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
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
                            <span>{notification.time}</span>
                            {notification.amount && (
                              <span className="font-semibold text-blue-600">{notification.amount}</span>
                            )}
                          </div>
                        </div>
                        {!notification.read && (
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
        {sampleNotifications.filter(n => n.read || n.priority === 'normal' || n.priority === 'low').length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              TERDAHULU ({sampleNotifications.filter(n => n.read || n.priority === 'normal' || n.priority === 'low').length})
            </h2>
            {sampleNotifications
              .filter(n => n.read || n.priority === 'normal' || n.priority === 'low')
              .map((notification) => {
                const Icon = notification.icon;
                return (
                  <Card
                    key={notification.id}
                    className="mb-3 cursor-pointer transition-all hover:shadow-sm opacity-75"
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
                            <span>{notification.time}</span>
                            {notification.amount && (
                              <span className="font-medium">{notification.amount}</span>
                            )}
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

      {/* Empty State (when no notifications) */}
      {sampleNotifications.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tiada Notifikasi</h3>
            <p className="text-gray-600">
              Notifikasi akan muncul di sini bila ada update penting
            </p>
          </CardContent>
        </Card>
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
