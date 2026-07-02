// admin/js/packages.js
import { db } from '../../js/firebase-config.js';
import { collection, addDoc, onSnapshot, deleteDoc, doc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, fetchCategoriesFromDB } from '../../js/shared.js';

const form = document.getElementById('add-package-form');
const listBody = document.getElementById('packages-list');
const categorySelect = document.getElementById('pkg-category');

// ==========================================
// تحميل التخصصات في القائمة المنسدلة
// ==========================================
async function loadCategoryOptions() {
    try {
        const categories = await fetchCategoriesFromDB();
        categorySelect.innerHTML = '<option value="">اختر التخصص...</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = `${cat.icon || ''} ${cat.name}`;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        categorySelect.innerHTML = '<option value="">خطأ في تحميل التخصصات</option>';
    }
}

// ==========================================
// بذر باقات افتراضية إذا كانت المجموعة فارغة
// ==========================================
const DEFAULT_PACKAGES = [
    { name: 'شحن فريون تكييف', category: 'تكييفات', price: 800, duration: '1-2 ساعات', description: 'شحن فريون كامل للتكييف مع فحص التسريب', icon: '❄️' },
    { name: 'تسليك مجاري', category: 'سباكة', price: 350, duration: '1-2 ساعات', description: 'تسليك مجاري بالأجهزة الحديثة', icon: '🚿' },
    { name: 'تركيب حنفية', category: 'سباكة', price: 200, duration: '30-60 دقيقة', description: 'تركيب حنفية جديدة مع ضمان التركيب', icon: '🚰' },
    { name: 'تنظيف عميق (شقة ≤150م²)', category: 'تنظيف', price: 600, duration: '3-5 ساعات', description: 'تنظيف شامل للشقة بالكامل', icon: '✨' },
    { name: 'صيانة سخان كهربائي', category: 'كهرباء', price: 250, duration: '1-2 ساعات', description: 'فحص وصيانة السخان الكهربائي', icon: '⚡' },
    { name: 'تركيب بريزة/مفتاح', category: 'كهرباء', price: 150, duration: '30 دقيقة', description: 'تركيب أو استبدال بريزة أو مفتاح كهرباء', icon: '🔌' },
    { name: 'إصلاح باب خشبي', category: 'نجارة', price: 300, duration: '1-3 ساعات', description: 'إصلاح وضبط باب خشبي', icon: '🪚' },
    { name: 'فك وتركيب تكييف', category: 'تكييفات', price: 500, duration: '2-3 ساعات', description: 'فك وإعادة تركيب التكييف في مكان جديد', icon: '🌡️' }
];

let isSeeding = false;
async function seedDefaultPackages() {
    if (isSeeding) return;
    isSeeding = true;
    try {
        for (const pkg of DEFAULT_PACKAGES) {
            await addDoc(collection(db, "packages"), {
                ...pkg,
                isActive: true,
                createdAt: serverTimestamp()
            });
        }
        showToast('تم إضافة الباقات الافتراضية تلقائياً!', 'success');
    } catch (error) {
        console.error("Seed default packages failed:", error);
    } finally {
        isSeeding = false;
    }
}

// ==========================================
// إضافة باقة جديدة يدوياً
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addBtn = document.getElementById('add-pkg-btn');
    addBtn.disabled = true; addBtn.innerText = 'جاري الإضافة...';

    const name = document.getElementById('pkg-name').value.trim();
    const category = document.getElementById('pkg-category').value;
    const price = Number(document.getElementById('pkg-price').value);
    const duration = document.getElementById('pkg-duration').value.trim();
    const description = document.getElementById('pkg-desc').value.trim();
    const icon = document.getElementById('pkg-icon').value.trim();

    if (!name || !category || !price) {
        showToast('يرجى ملء الحقول المطلوبة', 'error');
        addBtn.disabled = false; addBtn.innerText = 'إضافة الباقة';
        return;
    }

    if (price < 50) {
        showToast('الحد الأدنى للسعر 50 ج.م', 'error');
        addBtn.disabled = false; addBtn.innerText = 'إضافة الباقة';
        return;
    }

    try {
        await addDoc(collection(db, "packages"), {
            name,
            category,
            price,
            duration: duration || '',
            description: description || '',
            icon: icon || '📦',
            isActive: true,
            createdAt: serverTimestamp()
        });
        showToast('تم إضافة الباقة بنجاح', 'success');
        form.reset();
    } catch (error) {
        console.error("Error adding package:", error);
        showToast('حدث خطأ أثناء الإضافة', 'error');
    } finally {
        addBtn.disabled = false; addBtn.innerText = 'إضافة الباقة';
    }
});

// ==========================================
// جلب وعرض الباقات (Real-time)
// ==========================================
function loadPackages() {
    listBody.innerHTML = '<tr><td colspan="6" class="text-center py-8"><div class="animate-pulse flex flex-col items-center"><div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div><div class="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2"></div></div></td></tr>';

    onSnapshot(collection(db, "packages"), async (querySnapshot) => {
        listBody.innerHTML = '';

        // لو المجموعة فارغة، إضافة الباقات الافتراضية تلقائياً
        if (querySnapshot.empty) {
            listBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-primary-500 font-bold">جاري إضافة الباقات الافتراضية... ⏳</td></tr>';
            await seedDefaultPackages();
            return;
        }

        const packages = [];
        querySnapshot.forEach((document) => {
            packages.push({ id: document.id, ...document.data() });
        });

        // ترتيب حسب التاريخ
        packages.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });

        packages.forEach((pkg) => {
            const tr = window.document.createElement('tr');
            tr.className = "border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors";

            tr.innerHTML = `
                <td class="p-3 text-3xl drop-shadow-sm">${pkg.icon || '📦'}</td>
                <td class="p-3 font-black text-gray-800 dark:text-white">${pkg.name}</td>
                <td class="p-3 text-sm text-gray-600 dark:text-dark-muted font-bold">${pkg.category || '-'}</td>
                <td class="p-3 font-black text-green-600 dark:text-green-400">${pkg.price} ج.م</td>
                <td class="p-3 text-sm text-gray-600 dark:text-dark-muted font-bold">${pkg.duration || '-'}</td>
                <td class="p-3 text-center">
                    <button onclick="deletePackage('${pkg.id}')" class="text-red-500 hover:text-white font-bold px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-500 transition shadow-sm active:scale-95">حذف</button>
                </td>
            `;
            listBody.appendChild(tr);
        });
    }, (error) => {
        listBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500 font-bold">حدث خطأ أثناء جلب البيانات.</td></tr>';
        console.error("Error fetching packages:", error);
    });
}

// دالة الحذف
window.deletePackage = async (id) => {
    if(!confirm('هل أنت متأكد من حذف هذه الباقة نهائياً؟')) return;

    try {
        await deleteDoc(doc(db, "packages", id));
        showToast('تم حذف الباقة بنجاح', 'info');
    } catch (error) {
        showToast('حدث خطأ أثناء الحذف', 'error');
    }
};

// ==========================================
// تهيئة الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCategoryOptions();
    loadPackages();
});
