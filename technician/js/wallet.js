// technician/js/wallet.js
// technician/js/wallet.js
import { auth, db } from '../../js/firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadWalletData();
    } else {
        window.location.href = '../login.html';
    }
});

// Payment method badge config
const paymentBadges = {
    cash: {
        label: 'نقدي',
        icon: '💵',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/40'
    },
    instapay: {
        label: 'InstaPay',
        icon: '📱',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/40'
    },
    wallet: {
        label: 'محفظة',
        icon: '💰',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/40'
    }
};

function getPaymentBadgeHTML(method) {
    const badge = paymentBadges[method] || paymentBadges.cash;
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}">
        ${badge.icon} ${badge.label}
    </span>`;
}

async function loadWalletData() {
    const container = document.getElementById('transactions-container');
    
    try {
        const q = query(
            collection(db, "requests"), 
            where("technicianId", "==", currentUser.uid),
            where("status", "in", ["completed", "paid_and_rated"])
        );
        
        const snapshot = await getDocs(q);
        
        let totalRevenue = 0;
        const requests = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            requests.push(data);
            totalRevenue += data.cost || 0;
        });

        // حساب العمولة (10%)
        const commission = totalRevenue * 0.10;
        const netProfit = totalRevenue - commission;

        // تحديث الواجهة
        document.getElementById('total-revenue').innerText = `${totalRevenue} ج.م`;
        document.getElementById('app-commission').innerText = `${commission.toFixed(2)} ج.م`;
        document.getElementById('net-profit').innerHTML = `${netProfit} <span class="text-xl font-normal">ج.م</span>`;

        container.innerHTML = '';
        if (requests.length === 0) {
            container.innerHTML = '<div class="text-center py-5 text-gray-500 bg-white rounded shadow">لم تقم بأي رحلات مكتملة بعد.</div>';
            return;
        }

        // ترتيب تنازلي وعرض
        requests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()).forEach(req => {
            const date = req.createdAt.toDate().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            const paymentMethod = req.paymentMethod || 'cash';
            const badgeHTML = getPaymentBadgeHTML(paymentMethod);

            const item = document.createElement('div');
            item.className = "bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border flex justify-between items-center";
            item.innerHTML = `
                <div>
                    <p class="font-bold text-gray-800 dark:text-white">${req.category}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <p class="text-xs text-gray-500 dark:text-dark-muted">${date}</p>
                        ${badgeHTML}
                    </div>
                </div>
                <div class="text-left font-bold text-green-600 dark:text-green-400">
                    +${(req.cost * 0.90).toFixed(2)} ج.م
                </div>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Error loading wallet:", error);
        container.innerHTML = '<div class="text-center py-5 text-red-500">حدث خطأ أثناء جلب البيانات.</div>';
    }
}