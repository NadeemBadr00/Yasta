// firebase-messaging-sw.js — Service Worker للإشعارات في الخلفية
// يجب أن يكون هذا الملف في المجلد الجذري (root) للمشروع

// استيراد مكتبات Firebase المتوافقة مع Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// إعدادات Firebase — نفس الإعدادات المستخدمة في التطبيق
firebase.initializeApp({
    apiKey: 'AIzaSyDSxMAxSnGdBP4ECs_xBfYjJB8SXBQF5Qk',
    authDomain: 'ai-roadmap-jnadeem.firebaseapp.com',
    projectId: 'ai-roadmap-jnadeem',
    storageBucket: 'ai-roadmap-jnadeem.firebasestorage.app',
    messagingSenderId: '559610829258',
    appId: '1:559610829258:web:e3a3c7c5c7af5e3ea45cef'
});

// الحصول على Firebase Messaging instance
const messaging = firebase.messaging();

// معالجة الإشعارات في الخلفية (Background Messages)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] إشعار في الخلفية:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'يسطا — إشعار جديد';
    const notificationBody = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';

    const notificationOptions = {
        body: notificationBody,
        icon: '/img/icon-192.png',
        badge: '/img/icon-72.png',
        vibrate: [200, 100, 200],
        dir: 'rtl',
        lang: 'ar',
        tag: 'yasta-notification',
        renotify: true,
        data: payload.data || {},
        actions: [
            { action: 'open', title: 'فتح التطبيق' },
            { action: 'dismiss', title: 'تجاهل' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] تم النقر على الإشعار:', event);

    event.notification.close();

    if (event.action === 'dismiss') return;

    // فتح التطبيق أو التركيز على النافذة المفتوحة
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // إذا كان التطبيق مفتوحاً بالفعل — ركّز عليه
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // إذا لم يكن مفتوحاً — افتحه
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
