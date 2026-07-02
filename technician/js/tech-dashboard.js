// technician/js/tech-dashboard.js
import { auth, db } from '../../js/firebase-config.js';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, orderBy, limit, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { injectBottomNav, getSkeletonHtml, showToast, checkAuthState } from '../../js/shared.js';

let currentUser = null;
let techLocation = null;
let unsubscribeRequests = null;
let unsubscribeStats = null;
let weeklyChart = null;

// ==========================================
// DOM Elements
// ==========================================
const toggle = document.getElementById('online-toggle');
const toggleBg = document.getElementById('toggle-bg');
const toggleDot = document.getElementById('toggle-dot');
const statusText = document.getElementById('status-text');
const offlineMsg = document.getElementById('offline-msg');
const container = document.getElementById('requests-container');
const notifTrigger = document.getElementById('notif-trigger');
const notifPanel = document.getElementById('notif-panel');
const closeNotif = document.getElementById('close-notif');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// ==========================================
// Auth Check & Initialization
// ==========================================
checkAuthState(true, null);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        injectBottomNav('technician', 'dashboard');
        
        // Update user profile in navbar
        const nameEl = document.getElementById('user-name-display');
        const avatarEl = document.getElementById('user-avatar');
        const greetingEl = document.getElementById('greeting-text');
        
        // Try to fetch technician profile
        try {
            const techDoc = await getDoc(doc(db, "technicians", user.uid));
            if (techDoc.exists()) {
                const data = techDoc.data();
                const displayName = data.name || user.displayName || 'الفني';
                if (nameEl) nameEl.textContent = displayName;
                if (avatarEl) avatarEl.textContent = displayName.charAt(0);
                if (greetingEl) greetingEl.textContent = `أهلاً، ${displayName} 👋`;
            } else {
                const displayName = user.displayName || user.email?.split('@')[0] || 'الفني';
                if (nameEl) nameEl.textContent = displayName;
                if (avatarEl) avatarEl.textContent = displayName.charAt(0);
                if (greetingEl) greetingEl.textContent = `أهلاً، ${displayName} 👋`;
            }
        } catch (e) {
            const displayName = user.displayName || 'الفني';
            if (nameEl) nameEl.textContent = displayName;
            if (avatarEl) avatarEl.textContent = displayName.charAt(0);
            if (greetingEl) greetingEl.textContent = `أهلاً، ${displayName} 👋`;
        }
        
        // Load dashboard data
        loadDashboardStats(user.uid);
        loadWeeklyChart(user.uid);
        loadRecentJobs(user.uid);
        loadNotificationCount(user.uid);
    }
});

// ==========================================
// Sidebar Logout
// ==========================================
const logoutBtn = document.getElementById('sidebar-logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast('تم تسجيل الخروج بنجاح', 'success');
            window.location.href = '../login.html';
        } catch (e) {
            showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
        }
    });
}

// ==========================================
// Theme Toggle
// ==========================================
function updateThemeIcon() {
    if (themeIcon) {
        themeIcon.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    }
}
updateThemeIcon();

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        updateThemeIcon();
        // Re-render chart with updated colors
        if (currentUser) loadWeeklyChart(currentUser.uid);
    });
}

// ==========================================
// Notification Panel Toggle
// ==========================================
if (notifTrigger) {
    notifTrigger.addEventListener('click', () => {
        notifPanel.style.transform = 'translateX(0)';
    });
}
if (closeNotif) {
    closeNotif.addEventListener('click', () => {
        notifPanel.style.transform = 'translateX(150%)';
    });
}

// ==========================================
// Mobile Menu Toggle
// ==========================================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
        if (sidebar.style.display === 'flex') {
            sidebar.style.display = 'none';
        } else {
            sidebar.style.display = 'flex';
            sidebar.style.position = 'fixed';
            sidebar.style.top = '0';
            sidebar.style.right = '0';
            sidebar.style.zIndex = '9999';
            sidebar.style.boxShadow = '-10px 0 40px rgba(0,0,0,0.3)';
        }
    });
}

// ==========================================
// Distance Calculator (preserved)
// ==========================================
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; const dLat = (lat2 - lat1) * (Math.PI / 180); const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ==========================================
// Online/Offline Toggle — CRITICAL (preserved)
// ==========================================
toggle.addEventListener('change', (e) => {
    const isOnline = e.target.checked;
    const userStatusBadge = document.getElementById('user-status-badge');
    const radarStatus = document.getElementById('radar-status');
    
    if (isOnline) {
        toggleBg.classList.replace('bg-gray-300', 'bg-green-500');
        toggleBg.classList.replace('dark:bg-slate-600', 'bg-green-500');
        toggleDot.classList.replace('translate-x-0', '-translate-x-5');
        statusText.innerText = "متاح للعمل";
        statusText.classList.replace('text-gray-500', 'text-green-600');
        statusText.classList.replace('dark:text-dark-muted', 'dark:text-green-400');
        
        offlineMsg.classList.add('hidden');
        container.classList.remove('hidden');
        
        if (userStatusBadge) userStatusBadge.innerHTML = '<span class="text-emerald-500">متصل للعمل • فني</span>';
        if (radarStatus) radarStatus.textContent = 'الرادار يعمل... بانتظار طلبات في محيطك';
        
        // عرض السكيليتون أثناء البحث عن الموقع والطلبات
        container.innerHTML = getSkeletonHtml('list', 3);
        startListening();
    } else {
        toggleBg.classList.replace('bg-green-500', 'bg-gray-300');
        toggleBg.classList.replace('bg-green-500', 'dark:bg-slate-600');
        toggleDot.classList.replace('-translate-x-5', 'translate-x-0');
        statusText.innerText = "غير متاح";
        statusText.classList.replace('text-green-600', 'text-gray-500');
        statusText.classList.replace('dark:text-green-400', 'dark:text-dark-muted');
        
        offlineMsg.classList.remove('hidden');
        container.classList.add('hidden');
        
        if (userStatusBadge) userStatusBadge.innerHTML = '<span class="text-gray-400">غير متصل</span>';
        if (radarStatus) radarStatus.textContent = 'فعّل وضع "متاح للعمل" لبدء استقبال الطلبات';
        
        stopListening();
    }
});

// ==========================================
// Real-time Incoming Requests Listener (preserved)
// ==========================================
function startListening() {
    navigator.geolocation.getCurrentPosition((pos) => {
        techLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        const q = query(collection(db, "requests"), where("status", "==", "searching"));
        
        unsubscribeRequests = onSnapshot(q, (snapshot) => {
            container.innerHTML = ''; 
            let hasNearbyRequests = false;

            snapshot.forEach((reqDoc) => {
                const req = reqDoc.data();
                const distanceKm = getDistanceFromLatLonInKm(techLocation.lat, techLocation.lng, req.location.lat, req.location.lng);
                
                if (distanceKm <= 15) {
                    hasNearbyRequests = true;
                    const timeAgo = Math.floor((new Date() - req.createdAt.toDate()) / 60000); 
                    
                    const card = document.createElement('div');
                    card.className = "bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-primary-100 dark:border-primary-900/30 flex flex-col gap-4 active:scale-95 transition-transform";
                    card.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 text-xs font-bold px-3 py-1.5 rounded-full inline-block mb-2">يبعد ${distanceKm.toFixed(1)} كم 📍</span>
                                <h3 class="font-black text-lg text-gray-800 dark:text-white">مطلوب: ${req.category}</h3>
                            </div>
                            <span class="text-xs text-gray-500 font-bold bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">منذ ${timeAgo} دقيقة</span>
                        </div>
                        <p class="text-gray-600 dark:text-dark-muted text-sm font-bold bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">${req.description || 'لا يوجد وصف للمشكلة'}</p>
                        
                        <button onclick="acceptRequest('${reqDoc.id}')" class="w-full bg-primary-600 text-white py-3.5 rounded-xl font-black hover:bg-primary-700 shadow-md shadow-primary-500/30 transition">
                            قبول الطلب والتوجه للعميل
                        </button>
                    `;
                    container.appendChild(card);
                }
            });

            if (!hasNearbyRequests) {
                container.innerHTML = `
                <div class="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-dashed border-gray-200 dark:border-dark-border">
                    <div class="text-6xl mb-4 animate-pulse">📡</div>
                    <p class="text-gray-500 dark:text-dark-muted font-bold text-lg">الرادار يعمل...</p>
                    <p class="text-sm text-gray-400 mt-1">بانتظار طلبات جديدة في محيطك</p>
                </div>`;
            }
        });
    }, (err) => {
        showToast('يجب تفعيل الـ GPS لتلقي الطلبات', 'error');
        toggle.click(); 
    });
}

function stopListening() {
    if (unsubscribeRequests) { unsubscribeRequests(); unsubscribeRequests = null; }
}

// ==========================================
// Accept Request (preserved)
// ==========================================
window.acceptRequest = async (requestId) => {
    try {
        const reqRef = doc(db, "requests", requestId);
        await updateDoc(reqRef, { status: 'accepted', technicianId: currentUser.uid });
        showToast('تم قبول الطلب بنجاح! 🚀', 'success');
        window.location.href = `active-job.html?requestId=${requestId}`;
    } catch (error) {
        showToast('حدث خطأ. قد يكون فني آخر قام بقبول الطلب.', 'error');
    }
};

// ==========================================
// Dashboard Statistics (NEW)
// ==========================================
async function loadDashboardStats(uid) {
    try {
        // Get today's start timestamp
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(todayStart);

        // Today's tasks — requests assigned to this technician today
        const todayQuery = query(
            collection(db, "requests"),
            where("technicianId", "==", uid),
            where("createdAt", ">=", todayTimestamp)
        );
        const todaySnap = await getDocs(todayQuery);
        const todayCount = todaySnap.size;
        const todayEl = document.getElementById('stat-today');
        const todayBadge = document.getElementById('today-badge');
        if (todayEl) todayEl.textContent = todayCount;
        if (todayBadge) todayBadge.textContent = `+${todayCount} اليوم`;

        // All requests for this technician
        const allQuery = query(
            collection(db, "requests"),
            where("technicianId", "==", uid)
        );
        const allSnap = await getDocs(allQuery);
        
        let completedCount = 0;
        let inProgressCount = 0;
        let emergencyCount = 0;

        allSnap.forEach(docSnap => {
            const data = docSnap.data();
            const status = data.status;
            if (status === 'completed' || status === 'done') completedCount++;
            else if (status === 'accepted' || status === 'in_progress' || status === 'on_the_way') inProgressCount++;
            if (data.priority === 'emergency' || data.priority === 'urgent' || data.isEmergency === true) emergencyCount++;
        });

        const completedEl = document.getElementById('stat-completed');
        const inProgressEl = document.getElementById('stat-inprogress');
        const emergencyEl = document.getElementById('stat-emergency');
        
        if (completedEl) completedEl.textContent = completedCount;
        if (inProgressEl) inProgressEl.textContent = inProgressCount;
        if (emergencyEl) emergencyEl.textContent = emergencyCount;

        // Earnings — try from wallet or technician doc
        try {
            const techDoc = await getDoc(doc(db, "technicians", uid));
            if (techDoc.exists()) {
                const earnings = techDoc.data().wallet || techDoc.data().earnings || techDoc.data().balance || 0;
                const earningsEl = document.getElementById('stat-earnings');
                if (earningsEl) earningsEl.innerHTML = `${Number(earnings).toLocaleString('ar-EG')} <span class="text-sm">ج.م</span>`;
            }
        } catch (e) {
            console.log("Could not load earnings:", e);
        }
        
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        // Set fallback values
        ['stat-today', 'stat-completed', 'stat-inprogress', 'stat-emergency'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
    }
}

// ==========================================
// Weekly Productivity Chart (NEW)
// ==========================================
async function loadWeeklyChart(uid) {
    const isDark = document.documentElement.classList.contains('dark');
    const canvas = document.getElementById('mainDashboardChart');
    if (!canvas) return;

    // Build last 7 days labels
    const days = [];
    const dayLabels = [];
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
        dayLabels.push(arabicDays[d.getDay()]);
    }

    // Fetch completed tasks in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const completedData = [0, 0, 0, 0, 0, 0, 0];
    const allTasksData = [0, 0, 0, 0, 0, 0, 0];

    try {
        const weekQuery = query(
            collection(db, "requests"),
            where("technicianId", "==", uid),
            where("createdAt", ">=", Timestamp.fromDate(weekAgo))
        );
        const weekSnap = await getDocs(weekQuery);

        weekSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.createdAt) {
                const requestDate = data.createdAt.toDate();
                // Find which day bucket this falls into
                for (let j = 0; j < 7; j++) {
                    const dayStart = new Date(days[j]);
                    const dayEnd = new Date(days[j]);
                    dayEnd.setDate(dayEnd.getDate() + 1);
                    
                    if (requestDate >= dayStart && requestDate < dayEnd) {
                        allTasksData[j]++;
                        if (data.status === 'completed' || data.status === 'done') {
                            completedData[j]++;
                        }
                        break;
                    }
                }
            }
        });
    } catch (e) {
        console.log("Could not load weekly chart data:", e);
    }

    // Destroy old chart if exists
    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: dayLabels,
            datasets: [
                {
                    label: 'إجمالي المهام',
                    data: allTasksData,
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.6)' : 'rgba(37, 99, 235, 0.7)',
                    borderRadius: 12,
                    borderSkipped: false,
                    barPercentage: 0.5,
                    categoryPercentage: 0.7,
                },
                {
                    label: 'مكتملة',
                    data: completedData,
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.6)' : 'rgba(16, 185, 129, 0.7)',
                    borderRadius: 12,
                    borderSkipped: false,
                    barPercentage: 0.5,
                    categoryPercentage: 0.7,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#0f172a',
                    titleFont: { family: 'Cairo', weight: 'bold' },
                    bodyFont: { family: 'Cairo' },
                    padding: 14,
                    cornerRadius: 16,
                    rtl: true,
                    textDirection: 'rtl',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { family: 'Cairo', weight: 'bold', size: 11 },
                        color: isDark ? '#64748b' : '#94a3b8',
                    },
                    grid: { color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)', drawBorder: false },
                    border: { display: false }
                },
                x: {
                    ticks: {
                        font: { family: 'Cairo', weight: 'bold', size: 11 },
                        color: isDark ? '#64748b' : '#94a3b8',
                    },
                    grid: { display: false },
                    border: { display: false }
                }
            }
        }
    });
}

// ==========================================
// Recent Jobs Table (NEW)
// ==========================================
async function loadRecentJobs(uid) {
    const tbody = document.getElementById('dashboard-tasks-body');
    if (!tbody) return;

    try {
        const jobsQuery = query(
            collection(db, "requests"),
            where("technicianId", "==", uid),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const jobsSnap = await getDocs(jobsQuery);

        if (jobsSnap.empty) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400 text-sm">لا توجد مهام سابقة حتى الآن</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        let index = 1;

        jobsSnap.forEach(docSnap => {
            const data = docSnap.data();
            const statusMap = {
                'searching': { text: 'بحث', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
                'accepted': { text: 'مقبول', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                'in_progress': { text: 'جاري', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
                'on_the_way': { text: 'في الطريق', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
                'completed': { text: 'مكتمل', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                'done': { text: 'منتهي', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                'cancelled': { text: 'ملغي', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
            };
            
            const statusInfo = statusMap[data.status] || { text: data.status || 'غير محدد', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600' };
            
            const priorityMap = {
                'emergency': { text: 'طارئ', color: 'text-rose-500' },
                'urgent': { text: 'عاجل', color: 'text-amber-500' },
                'normal': { text: 'عادي', color: 'text-slate-400' },
            };
            const priorityInfo = priorityMap[data.priority] || { text: 'عادي', color: 'text-slate-400' };

            const cost = data.cost || data.price || data.amount || '--';
            const clientName = data.customerName || data.clientName || 'عميل';
            const location = data.address || data.locationName || data.category || '--';

            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';
            row.innerHTML = `
                <td class="py-5 px-3 md:px-4 text-xs font-black text-primary-600 dark:text-primary-400">#${String(index).padStart(3, '0')}</td>
                <td class="py-5 px-3 md:px-4">${clientName}</td>
                <td class="py-5 px-3 md:px-4 text-xs text-gray-400 hidden md:table-cell">${location}</td>
                <td class="py-5 px-3 md:px-4"><span class="px-3 py-1.5 rounded-full text-[10px] font-black ${statusInfo.color}">${statusInfo.text}</span></td>
                <td class="py-5 px-3 md:px-4 font-black hidden sm:table-cell">${cost !== '--' ? cost + ' ج.م' : '--'}</td>
                <td class="py-5 px-3 md:px-4 text-left hidden sm:table-cell"><span class="font-black text-xs ${priorityInfo.color}">${priorityInfo.text}</span></td>
            `;
            tbody.appendChild(row);
            index++;
        });

    } catch (error) {
        console.error("Error loading recent jobs:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400 text-sm">تعذر تحميل المهام</td></tr>`;
    }
}

// ==========================================
// Notification Count (NEW)
// ==========================================
async function loadNotificationCount(uid) {
    const countEl = document.getElementById('notif-count');
    const notifList = document.getElementById('notif-list');
    if (!countEl) return;

    try {
        // Count pending requests (searching) as notifications
        const pendingQuery = query(
            collection(db, "requests"),
            where("status", "==", "searching")
        );
        
        // Real-time listener for notification count
        onSnapshot(pendingQuery, (snapshot) => {
            const count = snapshot.size;
            countEl.textContent = count > 9 ? '9+' : count;
            
            // Also show/hide the pulse based on count
            if (count === 0) {
                countEl.classList.add('hidden');
            } else {
                countEl.classList.remove('hidden');
            }

            // Populate notification panel
            if (notifList) {
                if (count === 0) {
                    notifList.innerHTML = `
                        <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                            <p class="text-xs text-gray-400 font-bold">لا توجد إشعارات جديدة</p>
                        </div>`;
                } else {
                    notifList.innerHTML = '';
                    snapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        const div = document.createElement('div');
                        div.className = 'p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border-r-4 border-primary-500';
                        div.innerHTML = `
                            <p class="text-[10px] font-black text-primary-600 uppercase mb-1">طلب جديد</p>
                            <p class="text-xs font-bold leading-relaxed">طلب ${data.category || 'صيانة'} — ${data.address || data.locationName || 'موقع العميل'}</p>
                        `;
                        notifList.appendChild(div);
                    });
                }
            }
        });
    } catch (e) {
        console.log("Could not load notifications:", e);
        countEl.textContent = '0';
    }
}