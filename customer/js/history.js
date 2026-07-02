// customer/js/history.js
import { auth, db } from '../../js/firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { checkAuthState, getSkeletonHtml, showToast, injectBottomNav } from '../../js/shared.js';

let currentUser = null;

checkAuthState(true, null);
injectBottomNav('customer', 'history');

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadHistory();
    }
});

async function loadHistory() {
    const container = document.getElementById('history-container');
    container.innerHTML = getSkeletonHtml('list', 4);
    
    try {
        const q = query(
            collection(db, "requests"), 
            where("customerId", "==", currentUser.uid),
            where("status", "in", ["completed", "paid_and_rated"])
        );
        
        const snapshot = await getDocs(q);
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<div class="text-center py-10 text-gray-500 dark:text-dark-muted font-bold bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">لا توجد طلبات سابقة.</div>';
            return;
        }

        const requests = [];
        snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
        requests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

        requests.forEach(req => {
            const date = req.createdAt.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
            
            // Warranty logic
            const now = new Date();
            let warrantyBadge = '';
            let warrantyActive = false;
            if (req.warrantyExpiresAt) {
                const expiryDate = req.warrantyExpiresAt.toDate();
                if (expiryDate > now) {
                    warrantyActive = true;
                    const formattedDate = expiryDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
                    warrantyBadge = `<span class="inline-block mt-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold shadow-sm">🛡️ مضمون حتى ${formattedDate}</span>`;
                } else {
                    warrantyBadge = `<span class="inline-block mt-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-bold">⏰ انتهى الضمان</span>`;
                }
            }

            const card = document.createElement('div');
            card.className = "bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border transition hover:shadow-md";
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="font-black text-lg text-gray-800 dark:text-white mb-1">${req.category}</h3>
                        <p class="text-xs text-gray-500 dark:text-dark-muted font-bold truncate max-w-[200px] md:max-w-xs">${req.description || 'بدون وصف'}</p>
                        <span class="inline-block mt-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full font-bold shadow-sm">مكتمل ✅</span>
                        ${warrantyBadge}
                    </div>
                    <div class="text-left bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-dark-border min-w-[90px]">
                        <p class="text-[10px] text-gray-500 dark:text-dark-muted mb-1 font-bold uppercase tracking-wider">التكلفة</p>
                        <p class="text-xl font-black text-primary-600 dark:text-primary-400">${req.cost}</p>
                        <p class="text-[10px] text-gray-400 font-bold">ج.م</p>
                    </div>
                </div>
                ${req.warrantyExpiresAt ? `
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <button 
                        class="warranty-btn w-full py-2.5 rounded-xl font-bold text-sm transition active:scale-95 ${warrantyActive 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}" 
                        data-request-id="${req.id}" 
                        data-category="${req.category}" 
                        data-description="${req.description || ''}" 
                        ${!warrantyActive ? 'disabled' : ''}
                    >
                        🔄 طلب ضمان
                    </button>
                </div>` : ''}
            `;
            container.appendChild(card);
        });

        // Attach warranty button listeners
        document.querySelectorAll('.warranty-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', handleWarrantyRequest);
        });

    } catch (error) {
        console.error("Error loading history:", error);
        container.innerHTML = '<div class="text-center py-10 text-red-500 font-bold">حدث خطأ أثناء جلب السجلات.</div>';
    }
}

async function handleWarrantyRequest(e) {
    const btn = e.currentTarget;
    const originalRequestId = btn.dataset.requestId;
    const category = btn.dataset.category;
    const description = btn.dataset.description;

    btn.disabled = true;
    btn.textContent = '⏳ جاري إنشاء الطلب...';

    try {
        // Get GPS location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });

        const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        // Create warranty request
        const docRef = await addDoc(collection(db, "requests"), {
            customerId: currentUser.uid,
            category: category,
            description: description,
            isWarranty: true,
            originalRequestId: originalRequestId,
            status: 'searching',
            location: location,
            createdAt: serverTimestamp()
        });

        showToast('تم إنشاء طلب الضمان بنجاح!', 'success');
        setTimeout(() => {
            window.location.href = `finding-technician.html?requestId=${docRef.id}`;
        }, 500);

    } catch (error) {
        console.error('Error creating warranty request:', error);
        if (error.code === 1) {
            showToast('يرجى تفعيل خدمة الموقع', 'error');
        } else {
            showToast('حدث خطأ أثناء إنشاء الطلب', 'error');
        }
        btn.disabled = false;
        btn.textContent = '🔄 طلب ضمان';
    }
}