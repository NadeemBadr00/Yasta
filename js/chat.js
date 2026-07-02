// js/chat.js — وحدة المحادثة القابلة لإعادة الاستخدام
import { db, storage } from './firebase-config.js';
import {
    collection, addDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let _requestId = null;
let _currentUserId = null;
let _currentUserName = null;
let _currentUserRole = null;
let _unsubscribe = null;
let _messagesContainer = null;

/**
 * حساب الوقت المنقضي بالعربية
 */
function calculateTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return date.toLocaleDateString('ar-EG');
}

/**
 * بناء فقاعة رسالة واحدة
 */
function buildMessageBubble(msg) {
    const isOwn = msg.senderId === _currentUserId;
    const wrapper = document.createElement('div');
    wrapper.className = `flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 chat-bubble-anim`;

    const bubble = document.createElement('div');
    bubble.className = isOwn
        ? 'max-w-[80%] bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-bl-md px-4 py-2.5 shadow-lg shadow-blue-500/20'
        : 'max-w-[80%] bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-br-md px-4 py-2.5 shadow-md border border-gray-100 dark:border-slate-600';

    let inner = '';

    // اسم المرسل + badge الدور (للرسائل الأخرى فقط)
    if (!isOwn) {
        const roleBadge = msg.senderRole === 'technician'
            ? '<span class="inline-block bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">فني 🔧</span>'
            : '<span class="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">عميل</span>';
        inner += `<p class="text-[11px] font-bold mb-1 opacity-80">${msg.senderName} ${roleBadge}</p>`;
    }

    // محتوى الرسالة: صورة أو نص
    if (msg.imageUrl) {
        inner += `<img src="${msg.imageUrl}" alt="صورة" class="rounded-xl max-w-full max-h-60 cursor-pointer hover:opacity-90 transition" onclick="window.open('${msg.imageUrl}', '_blank')" />`;
        if (msg.text) {
            inner += `<p class="text-sm font-semibold mt-1.5 leading-relaxed">${msg.text}</p>`;
        }
    } else {
        inner += `<p class="text-sm font-semibold leading-relaxed">${msg.text}</p>`;
    }

    // الوقت
    const timeClass = isOwn ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500';
    inner += `<p class="text-[10px] mt-1 ${timeClass} text-left font-bold">${calculateTimeAgo(msg.createdAt)}</p>`;

    bubble.innerHTML = inner;
    wrapper.appendChild(bubble);
    return wrapper;
}

/**
 * تمرير تلقائي للأسفل
 */
function scrollToBottom() {
    if (_messagesContainer) {
        setTimeout(() => {
            _messagesContainer.scrollTop = _messagesContainer.scrollHeight;
        }, 100);
    }
}

/**
 * تهيئة المحادثة — الدالة الرئيسية
 * @returns {{ cleanup: Function }} دالة تنظيف لإلغاء الاشتراك
 */
export function initChat(requestId, currentUserId, currentUserName, currentUserRole) {
    _requestId = requestId;
    _currentUserId = currentUserId;
    _currentUserName = currentUserName;
    _currentUserRole = currentUserRole;
    _messagesContainer = document.getElementById('chat-messages');

    if (!_messagesContainer) {
        console.error('chat-messages container not found!');
        return { cleanup: () => {} };
    }

    // الاشتراك في الرسائل بشكل مباشر (Real-time)
    const messagesRef = collection(db, 'requests', _requestId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    _unsubscribe = onSnapshot(q, (snapshot) => {
        _messagesContainer.innerHTML = '';

        if (snapshot.empty) {
            _messagesContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full opacity-60 text-center px-6">
                    <span class="text-6xl mb-4">💬</span>
                    <p class="text-gray-500 dark:text-gray-400 font-bold text-lg">ابدأ المحادثة الآن!</p>
                    <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">اكتب رسالتك الأولى للتواصل</p>
                </div>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            _messagesContainer.appendChild(buildMessageBubble(msg));
        });
        scrollToBottom();
    });

    return {
        cleanup: () => {
            if (_unsubscribe) _unsubscribe();
        }
    };
}

/**
 * إرسال رسالة نصية
 */
export async function sendMessage(text) {
    if (!text || !text.trim() || !_requestId) return;

    const messagesRef = collection(db, 'requests', _requestId, 'messages');
    await addDoc(messagesRef, {
        senderId: _currentUserId,
        senderName: _currentUserName,
        senderRole: _currentUserRole,
        text: text.trim(),
        imageUrl: null,
        createdAt: serverTimestamp()
    });
}

/**
 * إرسال رسالة صورة (مع رفع الملف إلى Firebase Storage)
 */
export async function sendImageMessage(file) {
    if (!file || !_requestId) return;

    // رفع الصورة
    const timestamp = Date.now();
    const storageRef = ref(storage, `chat/${_requestId}/${timestamp}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // إرسال الرسالة مع رابط الصورة
    const messagesRef = collection(db, 'requests', _requestId, 'messages');
    await addDoc(messagesRef, {
        senderId: _currentUserId,
        senderName: _currentUserName,
        senderRole: _currentUserRole,
        text: '',
        imageUrl: downloadUrl,
        createdAt: serverTimestamp()
    });
}
