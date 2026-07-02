// js/tech-directory.js
import { auth, db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { checkAuthState, injectBottomNav, fetchCategoriesFromDB } from './shared.js';

checkAuthState(true, null);

const container = document.getElementById('techs-container');
const searchInput = document.getElementById('search-tech');
const sortSelect = document.getElementById('sort-select');

let allTechs = [];
let activeCategoryFilter = null;

// ==========================================
// إعداد الشريط الجانبي (Sidebar) للفلاتر من Firebase
// ==========================================
const sidebar = document.getElementById('filter-sidebar');
const overlay = document.getElementById('filter-overlay');

function toggleSidebar() {
    sidebar.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

document.getElementById('open-filter-sidebar').addEventListener('click', toggleSidebar);
document.getElementById('close-filter-sidebar').addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

async function renderFilterSidebar() {
    const sidebarCategories = document.getElementById('sidebar-categories');
    sidebarCategories.innerHTML = '';

    // زر الكل
    const allBtn = document.createElement('button');
    allBtn.className = "w-full text-right px-4 py-3 rounded-xl font-bold transition-colors bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 cat-filter-btn active";
    allBtn.dataset.cat = "all";
    allBtn.innerHTML = "🌍 عرض الكل";
    sidebarCategories.appendChild(allBtn);

    const dbCategories = await fetchCategoriesFromDB();

    dbCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = "w-full text-right px-4 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cat-filter-btn";
        btn.dataset.cat = cat.name;
        btn.innerHTML = `${cat.icon || '🛠️'} ${cat.name}`;
        sidebarCategories.appendChild(btn);
    });

    // تفعيل الأزرار
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-filter-btn').forEach(b => {
                b.classList.remove('bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400', 'active');
                b.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-slate-800');
            });

            const target = e.currentTarget;
            target.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-slate-800');
            target.classList.add('bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400', 'active');

            activeCategoryFilter = target.dataset.cat === 'all' ? null : target.dataset.cat;
            renderTechs();
            
            if(window.innerWidth < 768) toggleSidebar();
        });
    });
}

document.getElementById('reset-filters').addEventListener('click', () => {
    document.querySelector('.cat-filter-btn[data-cat="all"]').click();
});

// استدعاء البناء
renderFilterSidebar();

onAuthStateChanged(auth, (user) => {
    if (user) {
        injectBottomNav('customer', 'directory');
        loadTechnicians();
    }
});

function loadTechnicians() {
    onSnapshot(collection(db, "users"), (snapshot) => {
        allTechs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.role === 'technician' && data.status === 'verified') {
                allTechs.push({ id: doc.id, ...data });
            }
        });
        renderTechs();
    });
}

function renderTechs() {
    container.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;

    let filtered = allTechs.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(searchTerm) || 
                            (t.mainCategory && t.mainCategory.toLowerCase().includes(searchTerm)) ||
                            (t.subCategory && t.subCategory.toLowerCase().includes(searchTerm));
        
        // فلترة القائمة الجانبية هنا
        // نتحقق من mainCategory لأن الهيكل القديم كان يعتمد عليها، والهيكل الجديد يعتمد عليها أيضاً
        const matchCategory = activeCategoryFilter ? (t.mainCategory === activeCategoryFilter || t.subCategory === activeCategoryFilter) : true;
        
        return matchSearch && matchCategory;
    });

    // الترتيب
    if (sortBy === 'rating') {
        filtered.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else {
        filtered.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500 bg-white dark:bg-dark-card rounded-2xl border border-dashed dark:border-dark-border">لم نجد فنيين يطابقون بحثك.</div>';
        return;
    }

    filtered.forEach(tech => {
        const rating = (tech.rating || 5).toFixed(1);
        // نأخذ التخصص المسجل للفني أياً كان
        const techCategory = tech.subCategory || tech.mainCategory || 'فني عام';

        const card = document.createElement('div');
        card.className = "bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border flex items-center gap-4 transition hover:shadow-md";
        
        card.innerHTML = `
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0">
                ${tech.name.charAt(0)}
            </div>
            <div class="flex-1">
                <h3 class="font-black text-gray-900 dark:text-white text-lg">${tech.name}</h3>
                <p class="text-xs text-gray-500 dark:text-dark-muted font-bold mb-1">${techCategory}</p>
                <div class="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                    ⭐ ${rating}
                </div>
            </div>
            <a href="customer/request-service.html?category=${techCategory}" class="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition shadow-sm">
                💬
            </a>
        `;
        container.appendChild(card);
    });
}

searchInput.addEventListener('input', renderTechs);
sortSelect.addEventListener('change', renderTechs);