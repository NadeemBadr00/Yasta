// customer/js/customer-dashboard.js
import { auth } from '../../js/firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../../js/firebase-config.js';
import { injectBottomNav, checkAuthState, fetchCategoriesFromDB } from '../../js/shared.js';

checkAuthState(true, null);

onAuthStateChanged(auth, (user) => {
    if (user) {
        injectBottomNav('customer', 'dashboard');
        // Set welcome banner name
        const welcomeEl = document.getElementById('welcome-name');
        if (welcomeEl) {
            const displayName = user.displayName || 'صديقنا';
            welcomeEl.textContent = `مرحباً يا ${displayName}! 👋`;
        }
        // Load quick stats
        loadQuickStats(user.uid);
    }
});

const desktopLogout = document.getElementById('desktop-logout-btn');
if(desktopLogout) {
    desktopLogout.addEventListener('click', () => signOut(auth).then(() => window.location.href = '../login.html'));
}

// Load quick stats from Firestore
async function loadQuickStats(uid) {
    try {
        // Fetch orders count
        const ordersSnap = await getDocs(query(collection(db, 'requests'), where('customerId', '==', uid)));
        const ordersEl = document.getElementById('stat-orders');
        if (ordersEl) ordersEl.textContent = ordersSnap.size;

        // Fetch user profile for rating and balance
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const ratingEl = document.getElementById('stat-rating');
            const balanceEl = document.getElementById('stat-balance');
            if (ratingEl) ratingEl.textContent = data.rating ? data.rating.toFixed(1) : '5.0';
            if (balanceEl) balanceEl.textContent = (data.balance || 0) + ' ج.م';
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

const container = document.getElementById('categories-container');
const searchInput = document.getElementById('search-input');
const noResultsMsg = document.getElementById('no-results-msg');

let dbCategories = [];

// جلب التخصصات من قاعدة البيانات
async function initDashboard() {
    container.innerHTML = '<div class="text-center py-10 text-gray-500 font-bold">جاري تحميل الخدمات المتاحة...</div>';
    dbCategories = await fetchCategoriesFromDB();
    renderCategories();
}

// دالة رسم الخدمات
function renderCategories(filterText = '') {
    container.innerHTML = '';
    
    const searchStr = filterText.toLowerCase();
    const filteredCats = dbCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchStr) || 
        (cat.description && cat.description.toLowerCase().includes(searchStr))
    );

    if (filteredCats.length > 0) {
        noResultsMsg.classList.add('hidden');
        
        const section = document.createElement('div');
        section.className = "mb-8 fade-in";
        section.innerHTML = `
            <h3 class="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2 border-r-4 border-primary-500 pr-3">
                🧰 الخدمات المتاحة
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 stagger-children"></div>
        `;
        
        const grid = section.querySelector('.grid');
        
        filteredCats.forEach(cat => {
            const card = document.createElement('a');
            // توجيه العميل لصفحة الطلب مع تمرير اسم الخدمة
            card.href = `request-service.html?category=${encodeURIComponent(cat.name)}`;
            card.className = "glass bg-white/80 dark:bg-dark-card/80 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100/50 dark:border-dark-border/50 hover:shadow-xl hover:shadow-blue-500/10 hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-300 text-center group cursor-pointer block active:scale-95 card-hover card-shine";
            
            card.innerHTML = `
                <div class="text-4xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 emoji-glow">${cat.icon || '🛠️'}</div>
                <h4 class="text-sm md:text-base font-black text-gray-800 dark:text-white leading-tight">${cat.name}</h4>
                ${cat.description ? `<p class="text-[10px] md:text-xs text-gray-500 dark:text-dark-muted mt-2 line-clamp-2 font-bold">${cat.description}</p>` : ''}
            `;
            grid.appendChild(card);
        });
        
        container.appendChild(section);
    } else {
        noResultsMsg.classList.remove('hidden');
    }
}

searchInput.addEventListener('input', (e) => {
    renderCategories(e.target.value);
});

document.addEventListener('DOMContentLoaded', initDashboard);