// admin/js/admin-dashboard.js
// Enterprise Dashboard — Modular Firebase-powered analytics
import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ===== Auth Guard =====
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = '../login.html';
});

// ===== Logout =====
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '../login.html');
});

// ===== Main Dashboard Loader =====
async function loadDashboard() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadTopTechnicians(),
            loadRecentOperations()
        ]);
    } catch (error) {
        console.error("Dashboard load error:", error);
    }
}

// Expose for theme toggle chart re-render
window.loadDashboard = loadDashboard;

// ===== 1. Stats + Chart =====
async function loadDashboardStats() {
    try {
        // Users stats
        const usersSnap = await getDocs(collection(db, "users"));
        let customersCount = 0;
        let techsCount = 0;

        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.role === 'customer') customersCount++;
            if (data.role === 'technician' && data.status === 'verified') techsCount++;
        });

        // Requests stats
        const requestsSnap = await getDocs(collection(db, "requests"));
        let completedCount = 0;
        let totalRevenue = 0;
        const categoryCounts = {};

        requestsSnap.forEach(doc => {
            const data = doc.data();
            if (data.status === 'completed' || data.status === 'paid_and_rated') {
                completedCount++;
                totalRevenue += (data.cost || 0);
            }
            // Aggregate by category for chart
            if (data.category) {
                categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
            }
        });

        const appProfit = totalRevenue * 0.10; // 10% commission

        // Update stat cards
        document.getElementById('stat-customers').innerText = customersCount;
        document.getElementById('stat-techs').innerText = techsCount;
        document.getElementById('stat-requests').innerText = completedCount;
        document.getElementById('stat-revenue').innerText = `${appProfit.toFixed(2)} ج.م`;

        // Render chart
        renderChart(categoryCounts);

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// ===== 2. Chart.js — Category Distribution =====
function renderChart(dataObj) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Destroy previous chart instance if exists
    if (window.myChart) {
        window.myChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const labels = Object.keys(dataObj);
    const values = Object.values(dataObj);

    // Premium gradient colors
    const bgColors = [
        'rgba(14, 145, 233, 0.8)',   // primary blue
        'rgba(16, 185, 129, 0.8)',    // emerald
        'rgba(245, 158, 11, 0.8)',    // amber
        'rgba(239, 68, 68, 0.8)',     // red
        'rgba(139, 92, 246, 0.8)',    // violet
        'rgba(236, 72, 153, 0.8)',    // pink
        'rgba(6, 182, 212, 0.8)',     // cyan
        'rgba(251, 146, 60, 0.8)',    // orange
    ];

    const borderColors = bgColors.map(c => c.replace('0.8', '1'));

    window.myChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد الطلبات',
                data: values,
                backgroundColor: bgColors.slice(0, labels.length),
                borderColor: borderColors.slice(0, labels.length),
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    titleColor: isDark ? '#f8fafc' : '#0f172a',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 14,
                    titleFont: { family: 'Cairo', weight: 'bold', size: 13 },
                    bodyFont: { family: 'Cairo', size: 12 },
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: isDark ? '#64748b' : '#94a3b8',
                        font: { family: 'Cairo', weight: 'bold', size: 11 }
                    },
                    grid: {
                        color: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.6)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? '#64748b' : '#94a3b8',
                        font: { family: 'Cairo', weight: 'bold', size: 11 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== 3. Top Technicians =====
async function loadTopTechnicians() {
    const container = document.getElementById('top-techs-list');
    if (!container) return;

    try {
        // Query technicians ordered by rating descending, limit 5
        const techsQuery = query(
            collection(db, "users"),
            where("role", "==", "technician"),
            orderBy("rating", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(techsQuery);

        if (snapshot.empty) {
            container.innerHTML = `<p class="text-slate-400 text-sm text-center py-4">لا يوجد فنيين بعد</p>`;
            return;
        }

        container.innerHTML = '';
        let rank = 1;

        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.name || data.displayName || 'فني';
            const rating = data.rating || 0;
            const specialty = data.category || data.specialty || '—';
            const initial = name.charAt(0).toUpperCase();

            // Rank badge colors
            const rankColors = {
                1: 'bg-amber-500 text-white',
                2: 'bg-slate-400 text-white',
                3: 'bg-amber-700 text-white',
            };
            const rankClass = rankColors[rank] || 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

            const techEl = document.createElement('div');
            techEl.className = 'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all';
            techEl.innerHTML = `
                <span class="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-black ${rankClass}">${rank}</span>
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-black text-sm">${initial}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm text-slate-800 dark:text-white truncate">${name}</p>
                    <p class="text-[10px] text-slate-400 font-semibold">${specialty}</p>
                </div>
                <div class="text-left">
                    <span class="text-amber-500 text-xs font-black">⭐ ${rating.toFixed(1)}</span>
                </div>
            `;
            container.appendChild(techEl);
            rank++;
        });

    } catch (error) {
        console.error("Error loading top technicians:", error);
        // Fallback: load without ordering (index may not exist)
        await loadTopTechniciansFallback(container);
    }
}

// Fallback if composite index not ready
async function loadTopTechniciansFallback(container) {
    try {
        const snapshot = await getDocs(collection(db, "users"));
        const techs = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.role === 'technician') {
                techs.push({ ...data, id: doc.id });
            }
        });

        // Sort client-side
        techs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const top5 = techs.slice(0, 5);

        if (top5.length === 0) {
            container.innerHTML = `<p class="text-slate-400 text-sm text-center py-4">لا يوجد فنيين بعد</p>`;
            return;
        }

        container.innerHTML = '';

        top5.forEach((data, index) => {
            const rank = index + 1;
            const name = data.name || data.displayName || 'فني';
            const rating = data.rating || 0;
            const specialty = data.category || data.specialty || '—';
            const initial = name.charAt(0).toUpperCase();

            const rankColors = {
                1: 'bg-amber-500 text-white',
                2: 'bg-slate-400 text-white',
                3: 'bg-amber-700 text-white',
            };
            const rankClass = rankColors[rank] || 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

            const techEl = document.createElement('div');
            techEl.className = 'flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all';
            techEl.innerHTML = `
                <span class="w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-black ${rankClass}">${rank}</span>
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-black text-sm">${initial}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm text-slate-800 dark:text-white truncate">${name}</p>
                    <p class="text-[10px] text-slate-400 font-semibold">${specialty}</p>
                </div>
                <div class="text-left">
                    <span class="text-amber-500 text-xs font-black">⭐ ${rating.toFixed(1)}</span>
                </div>
            `;
            container.appendChild(techEl);
        });
    } catch (err) {
        console.error("Fallback technicians load error:", err);
        container.innerHTML = `<p class="text-red-400 text-sm text-center py-4">خطأ في تحميل البيانات</p>`;
    }
}

// ===== 4. Recent Operations =====
async function loadRecentOperations() {
    const tbody = document.getElementById('recent-requests-body');
    if (!tbody) return;

    try {
        // Try ordered query first
        const recentQuery = query(
            collection(db, "requests"),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const snapshot = await getDocs(recentQuery);

        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 text-sm">لا توجد عمليات بعد</td></tr>`;
            return;
        }

        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const data = doc.data();
            const row = createRequestRow(doc.id, data);
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading recent operations:", error);
        // Fallback: load without ordering
        await loadRecentOperationsFallback(tbody);
    }
}

// Fallback if index not ready
async function loadRecentOperationsFallback(tbody) {
    try {
        const snapshot = await getDocs(collection(db, "requests"));
        const requests = [];

        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });

        // Sort client-side by createdAt
        requests.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        const recent10 = requests.slice(0, 10);

        if (recent10.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 text-sm">لا توجد عمليات بعد</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        recent10.forEach(item => {
            const row = createRequestRow(item.id, item);
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Fallback recent ops error:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-400 text-sm">خطأ في تحميل البيانات</td></tr>`;
    }
}

// ===== Helper: Create Table Row =====
function createRequestRow(id, data) {
    const shortId = id.substring(0, 8).toUpperCase();
    const clientName = data.customerName || data.userName || '—';
    const service = data.category || data.service || '—';
    const cost = data.cost ? `${data.cost} ج.م` : '—';
    const status = data.status || 'pending';

    // Status badge mapping
    const statusMap = {
        'pending':        { label: 'في الانتظار', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
        'accepted':       { label: 'مقبول', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' },
        'in_progress':    { label: 'قيد التنفيذ', cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' },
        'completed':      { label: 'مكتمل', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
        'paid_and_rated': { label: 'مكتمل ومدفوع', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
        'cancelled':      { label: 'ملغي', cls: 'bg-red-50 text-red-600 dark:bg-red-500/10' },
    };
    const st = statusMap[status] || { label: status, cls: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10' };

    const tr = document.createElement('tr');
    tr.className = 'border-b dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors';
    tr.innerHTML = `
        <td class="py-4 px-4 font-mono text-[11px] font-bold text-primary-500">#${shortId}</td>
        <td class="py-4 px-4 font-bold text-sm text-slate-700 dark:text-slate-300">${clientName}</td>
        <td class="py-4 px-4 text-sm text-slate-500">${service}</td>
        <td class="py-4 px-4 text-center font-bold text-sm">${cost}</td>
        <td class="py-4 px-4 text-left">
            <span class="px-3 py-1 rounded-lg text-[10px] font-black ${st.cls}">${st.label}</span>
        </td>
    `;
    return tr;
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', loadDashboard);