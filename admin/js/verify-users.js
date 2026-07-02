// admin/js/verify-users.js
import { auth, db } from '../../js/firebase-config.js';
import { collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showToast, getSkeletonHtml } from '../../js/shared.js';
import { extractIdData, verifyIdMatch } from '../../js/gemini-ocr.js';

// ==========================================
// Auth Guard
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) window.location.href = '../login.html';
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '../login.html');
});

// ==========================================
// State
// ==========================================
let currentFilter = 'pending';
let searchQuery = '';
let allUsers = []; // cached users for current filter

// Status mapping: our tabs map to Firestore status values
const statusMap = {
    pending: 'pending_admin_approval',
    verified: 'verified',
    rejected: 'rejected'
};

// ==========================================
// DOM References
// ==========================================
const grid = document.getElementById('requests-grid');
const countPending = document.getElementById('count-pending');
const countVerified = document.getElementById('count-verified');
const countRejected = document.getElementById('count-rejected');

// ==========================================
// Load Stats (counts for each status)
// ==========================================
async function loadStats() {
    try {
        const techQuery = query(collection(db, "users"), where("role", "==", "technician"));
        const snapshot = await getDocs(techQuery);
        let pending = 0, verified = 0, rejected = 0;
        snapshot.forEach(d => {
            const s = d.data().status;
            if (s === 'pending_admin_approval') pending++;
            else if (s === 'verified') verified++;
            else if (s === 'rejected') rejected++;
        });
        if (countPending) countPending.textContent = pending;
        if (countVerified) countVerified.textContent = verified;
        if (countRejected) countRejected.textContent = rejected;
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// ==========================================
// Load Users by Status
// ==========================================
async function loadUsers() {
    if (!grid) return;
    grid.innerHTML = getSkeletonHtml('card', 4);

    try {
        const firestoreStatus = statusMap[currentFilter];
        const q = query(
            collection(db, "users"),
            where("status", "==", firestoreStatus),
            where("role", "==", "technician")
        );
        const snapshot = await getDocs(q);
        allUsers = [];
        snapshot.forEach(d => {
            allUsers.push({ uid: d.id, ...d.data() });
        });
        renderCards();
    } catch (error) {
        console.error('Error loading users:', error);
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-red-500 font-bold">حدث خطأ أثناء جلب البيانات.</div>';
    }
}

// ==========================================
// Render Cards (with search filter)
// ==========================================
function renderCards() {
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = allUsers.filter(u => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (u.name && u.name.toLowerCase().includes(q)) ||
               (u.email && u.email.toLowerCase().includes(q)) ||
               (u.phone && u.phone.includes(q));
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-32 text-center opacity-40">
                <div class="text-6xl mb-4">📭</div>
                <h3 class="text-xl font-bold">لا توجد طلبات في هذا القسم حالياً</h3>
            </div>
        `;
        return;
    }

    filtered.forEach(u => {
        const card = document.createElement('div');
        card.className = 'premium-card bg-white dark:bg-dark-card p-8 rounded-[2.5rem] flex flex-col shadow-sm';
        
        const isPending = currentFilter === 'pending';
        const statusBadge = !isPending ? `
            <div class="mt-auto py-3 text-center rounded-2xl border-2 border-dashed ${currentFilter === 'verified' ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'} font-black text-xs uppercase tracking-widest">
                تمت المراجعة: ${currentFilter === 'verified' ? 'مقبول ✅' : 'مرفوض ❌'}
            </div>
        ` : `
            <div class="flex gap-4 mt-auto">
                <button onclick="window.updateUserStatus('${u.uid}', 'verified')" class="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                    <span>✅</span> قبول التوثيق
                </button>
                <button onclick="window.updateUserStatus('${u.uid}', 'rejected')" class="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-red-500 font-black rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <span>❌</span> رفض
                </button>
            </div>
        `;

        card.innerHTML = `
            <!-- Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                <div class="flex items-center gap-5">
                    <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary-500/30">
                        ${u.name ? u.name[0] : '?'}
                    </div>
                    <div>
                        <h4 class="text-xl font-black dark:text-white leading-tight">${u.name || 'بدون اسم'}</h4>
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
                            <span class="text-[10px] bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">${u.category || u.selectedCategory || 'غير محدد'}</span>
                            ${u.email ? `<p class="text-xs font-bold text-slate-400">${u.email}</p>` : ''}
                        </div>
                    </div>
                </div>
                <div class="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-5 py-3 rounded-2xl">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">الرقم القومي</p>
                    <p class="font-mono text-slate-800 dark:text-white font-black tracking-tighter">${u.nationalId || '—'}</p>
                </div>
            </div>

            <!-- Meta Info Grid -->
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1">رقم الهاتف</p>
                    <p class="font-black text-sm text-slate-700 dark:text-slate-300">${u.phone || '—'}</p>
                </div>
                <div class="bg-slate-50 dark:bg-dark-bg p-4 rounded-2xl">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1">الخبرة العملية</p>
                    <p class="font-black text-sm text-slate-700 dark:text-slate-300">${u.experience || u.yearsOfExperience || '—'}</p>
                </div>
            </div>

            <!-- Documents Section -->
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">المستندات القانونية (اضغط للمعاينة)</p>
            <div class="grid grid-cols-3 gap-3 mb-4">
                ${u.idFrontUrl ? `
                <div class="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800" onclick="window.openImageModal('${u.idFrontUrl}', 'وجه البطاقة')">
                    <img src="${u.idFrontUrl}" class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110" alt="ID Front">
                    <div class="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px]">🔎 تكبير</div>
                </div>` : '<div class="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">لا يوجد</div>'}
                ${u.idBackUrl ? `
                <div class="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800" onclick="window.openImageModal('${u.idBackUrl}', 'ظهر البطاقة')">
                    <img src="${u.idBackUrl}" class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110" alt="ID Back">
                    <div class="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px]">🔎 تكبير</div>
                </div>` : '<div class="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">لا يوجد</div>'}
                ${u.criminalRecordUrl ? `
                <div class="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800" onclick="window.openImageModal('${u.criminalRecordUrl}', 'الصحيفة الجنائية')">
                    <img src="${u.criminalRecordUrl}" class="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110" alt="Criminal Record">
                    <div class="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px]">🔎 تكبير</div>
                </div>` : '<div class="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold">لا يوجد</div>'}
            </div>

            <!-- AI OCR Verification -->
            ${isPending && u.idFrontUrl ? `
            <button id="ai-btn-${u.uid}" onclick="window.runAiVerification('${u.uid}')" class="ai-btn w-full py-3.5 text-white font-black rounded-2xl flex items-center justify-center gap-3 text-sm mb-4">
                <span>🤖</span> تحقق تلقائي بالـ AI
            </button>
            <div id="ocr-results-${u.uid}"></div>
            ` : ''}

            <!-- Actions -->
            ${statusBadge}
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// Tab Filter
// ==========================================
function filterByStatus(status) {
    currentFilter = status;
    ['pending', 'verified', 'rejected'].forEach(s => {
        const btn = document.getElementById(`tab-${s}`);
        if (!btn) return;
        if (s === status) {
            btn.classList.add('tab-active');
            btn.classList.remove('text-slate-500');
        } else {
            btn.classList.remove('tab-active');
            btn.classList.add('text-slate-500');
        }
    });
    loadUsers();
}

// Wire up tab buttons
document.getElementById('tab-pending')?.addEventListener('click', () => filterByStatus('pending'));
document.getElementById('tab-verified')?.addEventListener('click', () => filterByStatus('verified'));
document.getElementById('tab-rejected')?.addEventListener('click', () => filterByStatus('rejected'));

// ==========================================
// Search
// ==========================================
document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCards();
});

// ==========================================
// Update Status (Accept/Reject)
// ==========================================
window.updateUserStatus = async (uid, newStatus) => {
    if (!confirm(`هل أنت متأكد من ${newStatus === 'verified' ? 'قبول' : 'رفض'} هذا الفني؟`)) return;

    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { status: newStatus });
        showToast(newStatus === 'verified' ? 'تم توثيق الفني بنجاح!' : 'تم رفض الطلب.', newStatus === 'verified' ? 'success' : 'info');
        loadUsers();
        loadStats();
    } catch (error) {
        showToast('حدث خطأ أثناء التحديث', 'error');
    }
};

// ==========================================
// Image Modal
// ==========================================
window.openImageModal = (src, title) => {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-image');
    const tit = document.getElementById('modal-title');
    if (!modal || !img || !tit) return;
    img.src = src;
    tit.innerText = title;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    document.getElementById('modal-content')?.classList.remove('scale-95');
};

function closeModal() {
    const modal = document.getElementById('image-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    document.getElementById('modal-content')?.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
document.getElementById('image-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// ==========================================
// Refresh
// ==========================================
document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadUsers();
    loadStats();
});

// ==========================================
// AI OCR Verification
// ==========================================

/**
 * تحويل صورة من URL إلى Base64
 */
async function imageUrlToBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // إزالة البادئة data:image/...;base64,
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * تشغيل التحقق التلقائي بالذكاء الاصطناعي على بطاقة الهوية
 */
window.runAiVerification = async (uid) => {
    const btn = document.getElementById(`ai-btn-${uid}`);
    const resultsDiv = document.getElementById(`ocr-results-${uid}`);
    const user = allUsers.find(u => u.uid === uid);

    if (!user || !user.idFrontUrl) {
        showToast('لا توجد صورة بطاقة لهذا الفني', 'error');
        return;
    }

    // حالة التحميل
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="ai-spinner"></span> جاري القراءة بالذكاء الاصطناعي...';
    }

    try {
        // 1. تحويل صورة وجه البطاقة إلى Base64
        const base64 = await imageUrlToBase64(user.idFrontUrl);

        // 2. استدعاء Gemini OCR
        const extractedData = await extractIdData(base64);

        // 3. مطابقة مع بيانات المستخدم المسجلة
        const matchResult = verifyIdMatch(extractedData, user);

        // 4. عرض النتائج
        const confidenceLabels = {
            high: { text: '✅ البيانات متطابقة — ثقة عالية', css: 'match-high' },
            medium: { text: '⚠️ تطابق جزئي — يحتاج مراجعة', css: 'match-medium' },
            low: { text: '❌ البيانات غير متطابقة', css: 'match-low' }
        };
        const conf = confidenceLabels[matchResult.confidence];

        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="ocr-results-panel">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-[10px] font-black text-violet-500 uppercase tracking-widest">🤖 نتائج القراءة الآلية</p>
                        <span class="match-badge ${conf.css}">${conf.text}</span>
                    </div>
                    <table class="ocr-table w-full">
                        <tr><td>الاسم</td><td class="dark:text-white">${extractedData.name || '—'}</td></tr>
                        <tr><td>الرقم القومي</td><td class="dark:text-white font-mono tracking-wider">${extractedData.nationalId || '—'}</td></tr>
                        <tr><td>العنوان</td><td class="dark:text-white">${extractedData.address || '—'}</td></tr>
                        <tr><td>تاريخ الميلاد</td><td class="dark:text-white">${extractedData.birthDate || '—'}</td></tr>
                        <tr><td>النوع</td><td class="dark:text-white">${extractedData.gender || '—'}</td></tr>
                        <tr><td>تاريخ الانتهاء</td><td class="dark:text-white">${extractedData.expiryDate || '—'}</td></tr>
                    </table>
                    <div class="mt-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl">
                        <p class="text-[10px] font-black text-slate-400 uppercase mb-2">تفاصيل المطابقة</p>
                        <pre class="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">${matchResult.details}</pre>
                    </div>
                </div>
            `;
        }

        // 5. إذا كانت الثقة عالية — أبرز زر القبول
        if (matchResult.confidence === 'high') {
            const acceptBtn = document.querySelector(`button[onclick="window.updateUserStatus('${uid}', 'verified')"]`);
            if (acceptBtn) {
                acceptBtn.classList.add('accept-highlight');
            }
            showToast('✅ البيانات متطابقة! يمكنك قبول التوثيق بثقة.', 'success');
        } else if (matchResult.confidence === 'medium') {
            showToast('⚠️ تطابق جزئي — يرجى مراجعة التفاصيل.', 'info');
        } else {
            showToast('❌ البيانات غير متطابقة — تحقق يدوياً.', 'error');
        }

        // إعادة الزر لحالته
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>🤖</span> إعادة التحقق بالـ AI';
        }

    } catch (error) {
        console.error('AI Verification Error:', error);
        showToast('فشل التحقق التلقائي: ' + error.message, 'error');

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>🤖</span> تحقق تلقائي بالـ AI';
        }
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="ocr-results-panel" style="border-color: rgba(239, 68, 68, 0.2);">
                    <p class="text-red-500 font-bold text-sm text-center">❌ ${error.message}</p>
                </div>
            `;
        }
    }
};

// ==========================================
// Initialize
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadUsers();
});