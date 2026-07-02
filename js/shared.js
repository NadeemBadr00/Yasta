// js/shared.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. جلب التخصصات ديناميكياً من قاعدة البيانات
// ==========================================
export async function fetchCategoriesFromDB() {
    try {
        const snap = await getDocs(collection(db, 'categories'));
        const categories = [];
        snap.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

// ==========================================
// 2. هندسة الوضع الليلي (Dark Mode Logic)
// ==========================================
export function initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        updateThemeIcon();
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            updateThemeIcon();
        });
    }
}

function updateThemeIcon() {
    const iconSpan = document.getElementById('theme-toggle-icon');
    if (iconSpan) iconSpan.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}

initTheme();

// ==========================================
// 3. نظام الإشعارات (Toast)
// ==========================================
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    let bgColor = type === 'error' ? 'bg-red-600 dark:bg-red-500' : type === 'info' ? 'bg-gray-800 dark:bg-gray-700' : 'bg-primary-600 dark:bg-primary-500'; 
    let icon = type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '✅';

    toast.className = `fixed bottom-5 right-5 text-white px-6 py-3 rounded-xl shadow-xl transition-all duration-300 z-[9999] flex items-center gap-3 slide-up ${bgColor}`;
    toast.innerHTML = `<span class="text-xl">${icon}</span> <span class="font-bold font-cairo">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// 4. التحقق من حالة الدخول وإدارة الصلاحيات
// ==========================================

// قائمة إيميلات المديرين (Admins)
const adminEmails = [
    'hassan7hassan22@gmail.com',
    'khalaaaf7474@gmail.com'
];

// دالة للتحقق مما إذا كان المستخدم مديراً
export function isUserAdmin(email) {
    if (!email) return false;
    const lowerCaseEmail = email.toLowerCase();
    // الأدمن هو من يبدأ إيميله بـ gcode4306 أو موجود في قائمة المديرين
    return lowerCaseEmail.startsWith('gcode4306') || adminEmails.includes(lowerCaseEmail);
}

export function checkAuthState(requireAuth = true, redirectUrl = null) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // إظهار قائمة المطور/المدير إذا كان المستخدم يملك الصلاحية
            if (isUserAdmin(user.email)) {
                injectDevMenu();
            }
            
            // إعادة التوجيه إذا كان المسار يتطلب صلاحيات ولم يكن المستخدم مديراً
            if (redirectUrl && !isUserAdmin(user.email)) {
                window.location.href = redirectUrl;
            }
        } else if (requireAuth) {
            const publicPages = ['index.html', 'login.html', 'register.html', ''];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (!publicPages.includes(currentPage)) {
                showToast('يجب تسجيل الدخول أولاً', 'error');
                setTimeout(() => {
                    const pathPrefix = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/customer/') || window.location.pathname.includes('/technician/') ? '../' : '';
                    window.location.href = pathPrefix + 'login.html';
                }, 1500);
            }
        }
    });
}

// ==========================================
// 5. واجهة المطور (Dev Menu)
// ==========================================
function injectDevMenu() {
    if (document.getElementById('dev-menu-container')) return;
    const path = window.location.pathname;
    const basePath = (path.includes('/customer/') || path.includes('/technician/') || path.includes('/admin/')) ? '../' : '';

    const container = document.createElement('div');
    container.id = 'dev-menu-container';
    container.innerHTML = `
        <button id="dev-fab" class="fixed bottom-6 left-6 z-[9990] bg-slate-900 dark:bg-slate-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-transform transform hover:scale-110 border-4 border-slate-700 dark:border-slate-500">⚙️</button>
        <div id="dev-modal" class="fixed inset-0 bg-black bg-opacity-60 z-[9995] hidden flex items-center justify-center backdrop-blur-sm transition-opacity fade-in">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-sm p-6 transform scale-95 transition-transform slide-up" dir="rtl">
                <div class="flex justify-between items-center mb-6 border-b dark:border-dark-border pb-3">
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-white">وضع المطور 👑</h2>
                    <button id="close-dev-modal" class="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none">&times;</button>
                </div>
                <div class="space-y-3">
                    <button onclick="window.location.href='${basePath}customer/dashboard.html'" class="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold py-3 rounded-xl transition shadow-sm">🧑‍🔧 بوابة العميل</button>
                    <button onclick="window.location.href='${basePath}technician/dashboard.html'" class="w-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 font-bold py-3 rounded-xl transition shadow-sm">🛠️ بوابة الفني</button>
                    <button onclick="window.location.href='${basePath}admin/dashboard.html'" class="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold py-3 rounded-xl transition shadow-sm">📊 لوحة الإدارة</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);
    document.getElementById('dev-fab').addEventListener('click', () => { document.getElementById('dev-modal').classList.remove('hidden'); setTimeout(() => document.querySelector('#dev-modal > div').classList.replace('scale-95', 'scale-100'), 10); });
    document.getElementById('close-dev-modal').addEventListener('click', () => { document.querySelector('#dev-modal > div').classList.replace('scale-100', 'scale-95'); setTimeout(() => document.getElementById('dev-modal').classList.add('hidden'), 200); });
}

// ==========================================
// 6. نظام التحميل الهيكلي (Skeleton Loaders)
// ==========================================
export function getSkeletonHtml(type = 'card', count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        if (type === 'card') {
            html += `<div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col items-center"><div class="w-16 h-16 rounded-full skeleton mb-4"></div><div class="w-3/4 h-5 skeleton rounded mb-2"></div><div class="w-1/2 h-3 skeleton rounded"></div></div>`;
        } else if (type === 'list') {
            html += `<div class="bg-white dark:bg-dark-card p-5 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border w-full flex gap-4"><div class="flex-1 space-y-3"><div class="w-1/3 h-5 skeleton rounded"></div><div class="w-full h-4 skeleton rounded"></div><div class="w-2/3 h-4 skeleton rounded"></div></div><div class="w-24 h-10 skeleton rounded-lg"></div></div>`;
        }
    }
    return html;
}

// ==========================================
// 7. شريط التنقل السفلي (Bottom Navigation)
// ==========================================
export function injectBottomNav(role, activeTab = 'dashboard') {
    if (document.getElementById('main-bottom-nav')) return;

    // الدالة الذكية لمعرفة المسار الحالي وتوجيه الروابط بشكل صحيح بدون أخطاء 404
    const getPath = (targetFolder, fileName) => {
        const currentPath = window.location.pathname;
        const currentFolder = currentPath.includes('/customer/') ? 'customer' :
                              currentPath.includes('/technician/') ? 'technician' :
                              currentPath.includes('/admin/') ? 'admin' : 'root';
        
        // لو الهدف في الـ root
        if (targetFolder === 'root') {
            if (currentFolder === 'root') return fileName;
            return `../${fileName}`;
        }
        // لو احنا في الـ root (زي index.html)
        if (currentFolder === 'root') return `${targetFolder}/${fileName}`;
        // لو احنا بالفعل جوه نفس الفولدر المطلوب
        if (currentFolder === targetFolder) return fileName;
        // لو احنا في فولدر مختلف وعايزين نروح لفولدر تاني
        return `../${targetFolder}/${fileName}`;
    };

    let links = [];
    if (role === 'customer') {
        links = [
            { id: 'dashboard', name: 'الرئيسية', icon: '🏠', url: getPath('customer', 'dashboard.html') },
            { id: 'directory', name: 'الفنيين', icon: '🔍', url: getPath('root', 'tech-directory.html') },
            { id: 'community', name: 'المجتمع', icon: '🌍', url: getPath('root', 'community.html') },
            { id: 'history', name: 'سجلاتي', icon: '📜', url: getPath('customer', 'history.html') },
            { id: 'request', name: 'طلب فني', icon: '➕', url: getPath('customer', 'request-service.html') + '?category=عام' },
            { id: 'finding', name: 'بحث', icon: '📡', url: getPath('customer', 'finding-technician.html') + '?requestId=test' },
            { id: 'tracking', name: 'التتبع', icon: '📍', url: getPath('customer', 'tracking.html') + '?requestId=test' },
            { id: 'checkout', name: 'الدفع', icon: '💳', url: getPath('customer', 'checkout-rating.html') + '?requestId=test' }
        ];
    } else if (role === 'technician') {
        links = [
            { id: 'dashboard', name: 'الطلبات', icon: '📡', url: getPath('technician', 'dashboard.html') },
            { id: 'community', name: 'المجتمع', icon: '🌍', url: getPath('root', 'community.html') },
            { id: 'wallet', name: 'المحفظة', icon: '💰', url: getPath('technician', 'wallet.html') }
        ];
    }

    const navHTML = `
        <nav id="main-bottom-nav" class="fixed bottom-0 left-0 w-full md:w-[800px] md:left-1/2 md:-translate-x-1/2 md:bottom-6 bg-white dark:bg-dark-card shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-50 rounded-t-2xl md:rounded-full border border-gray-100 dark:border-dark-border pb-safe md:pb-0 transition-all duration-300 overflow-x-auto hide-scrollbar" dir="rtl">
            <div class="flex items-center h-16 px-2 md:px-6 min-w-max gap-2 sm:gap-4 mx-auto justify-around">
                ${links.map(link => `
                    <a href="${link.url}" class="flex flex-col items-center justify-center w-[70px] h-full transition-colors ${activeTab === link.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500 hover:text-primary-500'}">
                        <span class="text-xl md:text-2xl mb-1 ${activeTab === link.id ? 'scale-110 drop-shadow-md' : 'grayscale opacity-70'} transition-transform">${link.icon}</span>
                        <span class="text-[10px] md:text-[11px] font-bold whitespace-nowrap">${link.name}</span>
                    </a>
                `).join('')}
            </div>
        </nav>
        <style>
            /* إخفاء شكل الـ scrollbar مع الحفاظ على إمكانية السحب */
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', navHTML);
    // ضبط المسافة السفلية للصفحة كي لا يغطي الشريط على المحتوى في الموبايل أو الكمبيوتر
    document.body.classList.add('pb-20', 'md:pb-28');
}