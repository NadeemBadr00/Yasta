// technician/js/reviews.js
import { auth, db } from '../../js/firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { checkAuthState, getSkeletonHtml } from '../../js/shared.js';

let currentUser = null;
checkAuthState(true, null);

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadReviews();
    }
});

function getStarsHTML(rating) {
    let html = '';
    for(let i=1; i<=5; i++) {
        html += `<span class="text-2xl ${i <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-200 dark:text-slate-600'}">★</span>`;
    }
    return html;
}

async function loadReviews() {
    const container = document.getElementById('reviews-container');
    container.innerHTML = getSkeletonHtml('list', 3);
    
    try {
        const q = query(collection(db, "reviews"), where("technicianId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        
        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = '<div class="text-center py-10 text-gray-500 dark:text-dark-muted font-bold bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border">لا توجد تقييمات حتى الآن. استمر في تقديم خدمة ممتازة!</div>';
            return;
        }

        const reviews = [];
        snapshot.forEach(doc => reviews.push(doc.data()));
        reviews.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

        reviews.forEach(rev => {
            const date = rev.createdAt.toDate().toLocaleDateString('ar-EG');
            const card = document.createElement('div');
            card.className = "bg-white dark:bg-dark-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border mb-4";
            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex gap-1">${getStarsHTML(rev.rating)}</div>
                    <span class="text-xs font-bold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded">${date}</span>
                </div>
                <p class="text-gray-700 dark:text-gray-300 font-bold bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border-r-4 border-yellow-400">"${rev.comment || 'تقييم ممتاز بدون تعليق نصي'}"</p>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = '<div class="text-center py-5 text-red-500 font-bold">حدث خطأ أثناء جلب البيانات.</div>';
    }
}