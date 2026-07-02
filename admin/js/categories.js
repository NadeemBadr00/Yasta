// admin/js/categories.js
import { db } from '../../js/firebase-config.js';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from '../../js/shared.js';
// استيراد الملف الثابت القديم لجلب الداتا منه
import { SERVICE_CATEGORIES } from '../../js/categories-data.js';

const form = document.getElementById('add-category-form');
const listBody = document.getElementById('categories-list');

// ==========================================
// مزامنة التخصصات الأساسية تلقائياً (بدون زرار)
// ==========================================
let isImporting = false;
async function autoSyncCategories() {
    if (isImporting) return;
    isImporting = true;
    try {
        for (const mainKey in SERVICE_CATEGORIES) {
            const mainCat = SERVICE_CATEGORIES[mainKey];
            for (const sub of mainCat.subs) {
                if (sub.name !== 'أخرى') {
                    await addDoc(collection(db, "categories"), {
                        name: sub.name,
                        icon: sub.icon,
                        description: sub.desc,
                        createdAt: serverTimestamp()
                    });
                }
            }
        }
        showToast('تم مزامنة التخصصات تلقائياً!', 'success');
    } catch (error) {
        console.error("Auto sync failed:", error);
    } finally {
        isImporting = false;
    }
}

// ==========================================
// إضافة تخصص جديد يدوياً
// ==========================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addBtn = document.getElementById('add-btn');
    addBtn.disabled = true; addBtn.innerText = 'جاري الإضافة...';

    const name = document.getElementById('cat-name').value;
    const icon = document.getElementById('cat-icon').value;
    const desc = document.getElementById('cat-desc').value;

    try {
        await addDoc(collection(db, "categories"), { 
            name, 
            icon, 
            description: desc, 
            createdAt: serverTimestamp() 
        });
        showToast('تم إضافة التخصص بنجاح', 'success');
        form.reset();
    } catch (error) {
        showToast('حدث خطأ أثناء الإضافة', 'error');
    } finally {
        addBtn.disabled = false; addBtn.innerText = 'إضافة التخصص';
    }
});

// ==========================================
// جلب وعرض التخصصات (Real-time)
// ==========================================
function loadCategories() {
    listBody.innerHTML = '<tr><td colspan="4" class="text-center py-8"><div class="animate-pulse flex flex-col items-center"><div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div><div class="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/2"></div></div></td></tr>';
    
    onSnapshot(collection(db, "categories"), async (querySnapshot) => {
        listBody.innerHTML = '';

        // لو الداتا بيز فاضية، هيستدعي دالة المزامنة تلقائياً
        if (querySnapshot.empty) {
            listBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-primary-500 font-bold">جاري مزامنة التخصصات تلقائياً... ⏳</td></tr>';
            await autoSyncCategories();
            return;
        }

        const categories = [];
        querySnapshot.forEach((document) => {
            categories.push({ id: document.id, ...document.data() });
        });

        // ترتيب التخصصات
        categories.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });

        categories.forEach((cat) => {
            const tr = window.document.createElement('tr');
            tr.className = "border-b border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors";
            
            tr.innerHTML = `
                <td class="p-3 text-3xl drop-shadow-sm">${cat.icon}</td>
                <td class="p-3 font-black text-gray-800 dark:text-white">${cat.name}</td>
                <td class="p-3 text-sm text-gray-600 dark:text-dark-muted font-bold">${cat.description || '-'}</td>
                <td class="p-3 text-center">
                    <button onclick="deleteCategory('${cat.id}')" class="text-red-500 hover:text-white font-bold px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-500 transition shadow-sm active:scale-95">حذف</button>
                </td>
            `;
            listBody.appendChild(tr);
        });
    }, (error) => {
        listBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500 font-bold">حدث خطأ أثناء جلب البيانات.</td></tr>';
        console.error("Error fetching categories:", error);
    });
}

// دالة الحذف
window.deleteCategory = async (id) => {
    if(!confirm('هل أنت متأكد من حذف هذا التخصص نهائياً؟ \nملاحظة: حذفه من هنا سيخفيه من فلاتر العملاء والفنيين.')) return;
    
    try {
        await deleteDoc(doc(db, "categories", id));
        showToast('تم حذف التخصص بنجاح', 'info');
    } catch (error) {
        showToast('حدث خطأ أثناء الحذف', 'error');
    }
};

document.addEventListener('DOMContentLoaded', loadCategories);