// Service Worker for Push Notifications
// PocketBizz - Real-time Notification System

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let data = {
    title: 'PocketBizz',
    body: 'Anda ada notifikasi baru',
    icon: '/logo-icon.svg',
    badge: '/logo-icon.svg',
    tag: 'pocketbizz-notification',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/logo-icon.svg',
    badge: data.badge || '/logo-icon.svg',
    tag: data.tag || 'pocketbizz-notification',
    data: {
      url: data.actionUrl || data.url || '/notifications',
      notificationId: data.id,
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.priority === 'urgent' || data.priority === 'high',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PocketBizz', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle background sync (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Fetch latest notifications in background
  try {
    const response = await fetch('/api/notifications', {
      credentials: 'include'
    });
    if (response.ok) {
      const notifications = await response.json();
      console.log('[SW] Synced notifications:', notifications.length);
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}
