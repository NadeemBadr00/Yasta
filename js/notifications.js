// js/notifications.js — وحدة الإشعارات (FCM Push Notifications)
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { app, auth, db } from './firebase-config.js';

// VAPID Key — يجب استبداله بمفتاحك الخاص من إعدادات FCM في Firebase Console
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE';

/**
 * requestNotificationPermission()
 * يطلب إذن الإشعارات من المستخدم، ويحصل على FCM Token ويحفظه في Firestore
 * @returns {Promise<string|null>} FCM token أو null في حالة الفشل
 */
export async function requestNotificationPermission() {
    try {
        // التحقق من دعم المتصفح للإشعارات
        if (!('Notification' in window)) {
            console.warn('هذا المتصفح لا يدعم الإشعارات');
            return null;
        }

        // التحقق من دعم Service Worker
        if (!('serviceWorker' in navigator)) {
            console.warn('هذا المتصفح لا يدعم Service Workers');
            return null;
        }

        // طلب الإذن من المستخدم
        const permission = await Notification.requestPermission();

        if (permission === 'denied') {
            console.warn('المستخدم رفض إذن الإشعارات');
            return null;
        }

        if (permission !== 'granted') {
            console.warn('لم يتم منح إذن الإشعارات');
            return null;
        }

        // تسجيل Service Worker الخاص بـ FCM
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // التحقق من وجود VAPID Key حقيقي
        if (!VAPID_KEY || VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
            console.warn('⚠️ VAPID Key غير مضبوط — الإشعارات المحلية فعالة لكن FCM Push معطل.');
            console.warn('→ اذهب إلى Firebase Console → Project Settings → Cloud Messaging → Web Push certificates');
            // نرجع null بدون crash — الإشعارات المحلية (في التطبيق) هتشتغل عادي
            return null;
        }

        // الحصول على Firebase Messaging instance
        const messaging = getMessaging(app);

        // الحصول على FCM Token
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (!token) {
            console.warn('لم يتم الحصول على FCM Token');
            return null;
        }

        console.log('✅ FCM Token:', token);

        // حفظ الـ Token في Firestore تحت المستخدم الحالي
        const user = auth.currentUser;
        if (user) {
            await setDoc(doc(db, 'users', user.uid), {
                fcmToken: token
            }, { merge: true });
            console.log('✅ تم حفظ FCM Token في Firestore');
        }

        return token;

    } catch (error) {
        console.error('خطأ في إعداد الإشعارات:', error);
        return null;
    }
}

/**
 * onMessageReceived(callback)
 * يستمع للإشعارات الواردة أثناء فتح التطبيق (Foreground)
 * @param {Function} callback — دالة تُنفذ عند وصول إشعار: callback({ title, body, data })
 */
export function onMessageReceived(callback) {
    try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return;
        }

        const messaging = getMessaging(app);

        onMessage(messaging, (payload) => {
            console.log('📩 إشعار وارد (Foreground):', payload);

            const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
            const body = payload.notification?.body || payload.data?.body || '';
            const data = payload.data || {};

            // عرض Toast notification داخل التطبيق
            showNotificationToast(title, body);

            // تنفيذ الـ callback إذا وُجد
            if (typeof callback === 'function') {
                callback({ title, body, data });
            }
        });

    } catch (error) {
        console.error('خطأ في إعداد مستمع الإشعارات:', error);
    }
}

/**
 * showNotificationToast(title, body)
 * يعرض إشعار Toast داخل الصفحة
 */
function showNotificationToast(title, body) {
    // إنشاء عنصر Toast
    const toast = document.createElement('div');
    toast.className = 'fcm-toast';
    toast.innerHTML = `
        <div class="fcm-toast-icon">🔔</div>
        <div class="fcm-toast-content">
            <strong class="fcm-toast-title">${title}</strong>
            <p class="fcm-toast-body">${body}</p>
        </div>
        <button class="fcm-toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    // تطبيق الأنماط
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border-right: 4px solid #3b82f6;
        max-width: 380px;
        animation: fcmSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Cairo', sans-serif;
        direction: rtl;
    `;

    // التحقق من الوضع الداكن
    if (document.documentElement.classList.contains('dark')) {
        toast.style.background = '#1e293b';
        toast.style.color = '#f8fafc';
        toast.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.4)';
    }

    // إضافة CSS Animation
    if (!document.getElementById('fcm-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'fcm-toast-styles';
        style.textContent = `
            @keyframes fcmSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fcmSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .fcm-toast-icon { font-size: 24px; }
            .fcm-toast-title { display: block; font-size: 14px; margin-bottom: 2px; }
            .fcm-toast-body { font-size: 12px; color: #64748b; margin: 0; }
            .fcm-toast-close {
                background: none; border: none; font-size: 16px;
                cursor: pointer; color: #94a3b8; padding: 4px;
                margin-right: auto;
            }
            .fcm-toast-close:hover { color: #ef4444; }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // إزالة التوست تلقائياً بعد 6 ثوانٍ
    setTimeout(() => {
        toast.style.animation = 'fcmSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}
