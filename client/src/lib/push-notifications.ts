// Push Notification Helper
// Register service worker and handle push subscriptions

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Push] Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.log('[Push] Notification permission denied');
    return null;
  }

  const registration = await registerServiceWorker();
  
  if (!registration) {
    return null;
  }

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe to push notifications
      // Note: You'll need to generate VAPID keys for production
      // Run: npx web-push generate-vapid-keys
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // Public VAPID key - replace with your own in production
          process.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYqjMEtS0ZqQ6qVMQiLDr90TjvCnILCKPYLuIEz0MBmrMTd2RJf8o'
        ),
      });
      
      console.log('[Push] Subscribed to push notifications:', subscription);
    }

    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed from push notifications');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Show a test notification
export async function showTestNotification() {
  const permission = await requestNotificationPermission();
  
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification('PocketBizz', {
      body: 'Notifikasi push berjaya diaktifkan! 🔔',
      icon: '/logo-icon.svg',
      badge: '/logo-icon.svg',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
    });
  }
}
