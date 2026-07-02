// customer/js/checkout-rating.js
// customer/js/checkout-rating.js
import { auth, db, storage } from '../../js/firebase-config.js';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, Timestamp, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { showToast, injectBottomNav } from '../../js/shared.js';

const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get('requestId');
if (!requestId) window.location.href = 'dashboard.html';

let reqData = null;
let selectedPayment = 'cash';
let receiptFile = null;
let receiptDownloadUrl = null;
let walletBalance = 0;
let currentUserId = null;

injectBottomNav('customer', 'checkout');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;

        // جلب الفاتورة من الطلب
        const docSnap = await getDoc(doc(db, "requests", requestId));
        if (docSnap.exists()) {
            reqData = docSnap.data();
            document.getElementById('total-cost').innerHTML = `${reqData.cost} <span class="text-sm">ج.م</span>`;
            const serviceCostEl = document.getElementById('service-cost');
            if (serviceCostEl) serviceCostEl.textContent = `${reqData.cost} ج.م`;
        }

        // جلب رصيد المحفظة
        await fetchWalletBalance(user.uid);
    } else {
        window.location.href = '../login.html';
    }
});

// ========== Wallet Balance ==========
async function fetchWalletBalance(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            walletBalance = userDoc.data().walletBalance || 0;
        }
        document.getElementById('wallet-balance-label').textContent = walletBalance.toFixed(2);
    } catch (err) {
        console.error("Error fetching wallet:", err);
        walletBalance = 0;
        document.getElementById('wallet-balance-label').textContent = '0';
    }
}

// ========== Payment Method Selection ==========
const payCards = document.querySelectorAll('.pay-card');
const instapayDetails = document.getElementById('instapay-details');
const walletDetails = document.getElementById('wallet-details');

payCards.forEach(card => {
    card.addEventListener('click', () => {
        const method = card.dataset.method;
        selectPaymentMethod(method);
    });
});

function selectPaymentMethod(method) {
    selectedPayment = method;

    // Update card selection
    payCards.forEach(c => c.classList.remove('selected'));
    document.getElementById(`pay-card-${method}`).classList.add('selected');

    // Toggle InstaPay details
    if (method === 'instapay') {
        instapayDetails.classList.add('open');
    } else {
        instapayDetails.classList.remove('open');
    }

    // Toggle Wallet details
    if (method === 'wallet') {
        walletDetails.classList.add('open');
        updateWalletStatusPanel();
    } else {
        walletDetails.classList.remove('open');
    }

    // Update submit button text
    const btn = document.getElementById('submit-btn');
    switch (method) {
        case 'cash':
            btn.innerText = 'تأكيد الدفع نقداً وإرسال التقييم';
            break;
        case 'instapay':
            btn.innerText = 'تأكيد التحويل وإرسال التقييم';
            break;
        case 'wallet':
            btn.innerText = 'ادفع من المحفظة وإرسال التقييم';
            break;
    }
}

function updateWalletStatusPanel() {
    const panel = document.getElementById('wallet-status-panel');
    const cost = reqData ? reqData.cost : 0;

    if (walletBalance >= cost) {
        panel.className = 'p-4 rounded-2xl border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40';
        panel.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-3xl check-pulse">✅</div>
                <div>
                    <p class="font-bold text-green-700 dark:text-green-400 text-sm">رصيدك كافي للدفع</p>
                    <p class="text-xs text-green-600 dark:text-green-500">الرصيد الحالي: <strong>${walletBalance.toFixed(2)} ج.م</strong> — التكلفة: <strong>${cost} ج.م</strong></p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">الرصيد بعد الدفع: <strong>${(walletBalance - cost).toFixed(2)} ج.م</strong></p>
                </div>
            </div>
        `;
    } else {
        panel.className = 'p-4 rounded-2xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40';
        panel.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-3xl">❌</div>
                <div>
                    <p class="font-bold text-red-700 dark:text-red-400 text-sm">رصيدك غير كافي</p>
                    <p class="text-xs text-red-600 dark:text-red-500">الرصيد الحالي: <strong>${walletBalance.toFixed(2)} ج.م</strong> — التكلفة: <strong>${cost} ج.م</strong></p>
                    <p class="text-xs text-red-500 dark:text-red-400 mt-1">ينقصك: <strong>${(cost - walletBalance).toFixed(2)} ج.م</strong></p>
                </div>
            </div>
        `;
    }
}

// ========== Copy InstaPay Number ==========
const copyBtn = document.getElementById('copy-number-btn');
if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText('01012345678').then(() => {
            copyBtn.innerHTML = '✅ تم النسخ!';
            setTimeout(() => { copyBtn.innerHTML = '📋 نسخ'; }, 2000);
        });
    });
}

// ========== Receipt Upload ==========
const receiptInput = document.getElementById('receipt-input');
const uploadArea = document.getElementById('upload-area');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadSuccess = document.getElementById('upload-success');
const receiptPreview = document.getElementById('receipt-preview');

if (receiptInput) {
    receiptInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('حجم الملف كبير جداً (الحد الأقصى 5MB)', 'error');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('يُرجى رفع صورة فقط', 'error');
            return;
        }

        receiptFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            receiptPreview.src = ev.target.result;
            receiptPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // Update upload UI
        uploadPlaceholder.classList.add('hidden');
        uploadSuccess.classList.remove('hidden');
        uploadArea.classList.add('has-file');
    });
}

// ========== Upload receipt to Firebase Storage ==========
async function uploadReceipt() {
    if (!receiptFile) return null;

    const timestamp = Date.now();
    const storageRef = ref(storage, `receipts/${requestId}_${timestamp}`);
    const snapshot = await uploadBytes(storageRef, receiptFile);
    const url = await getDownloadURL(snapshot.ref);
    return url;
}

// ========== Form Submit ==========
document.getElementById('rating-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!reqData) return;

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerText = 'جاري الإرسال...';

    const stars = parseInt(document.querySelector('input[name="rate"]:checked').value);
    const text = document.getElementById('review-text').value;

    try {
        // Validate payment method requirements
        if (selectedPayment === 'instapay' && !receiptFile) {
            showToast('يُرجى رفع إيصال التحويل أولاً', 'error');
            btn.disabled = false;
            selectPaymentMethod('instapay');
            return;
        }

        if (selectedPayment === 'wallet') {
            const cost = reqData.cost || 0;
            if (walletBalance < cost) {
                showToast('رصيدك غير كافي للدفع من المحفظة', 'error');
                btn.disabled = false;
                selectPaymentMethod('wallet');
                return;
            }
        }

        // Upload receipt if InstaPay
        if (selectedPayment === 'instapay') {
            btn.innerText = 'جاري رفع الإيصال...';
            receiptDownloadUrl = await uploadReceipt();
        }

        // 1. إضافة التقييم
        await addDoc(collection(db, "reviews"), {
            technicianId: reqData.technicianId,
            customerId: reqData.customerId,
            requestId: requestId,
            rating: stars,
            comment: text,
            createdAt: serverTimestamp()
        });

        // 2. تحديث حالة الطلب مع بيانات الدفع
        const updatePayload = {
            status: 'paid_and_rated',
            warrantyExpiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            paymentMethod: selectedPayment,
            paidAt: serverTimestamp()
        };

        // Add payment-specific fields
        if (selectedPayment === 'instapay' && receiptDownloadUrl) {
            updatePayload.paymentReceiptUrl = receiptDownloadUrl;
        }

        if (selectedPayment === 'wallet') {
            updatePayload.paidFromWallet = true;
        }

        await updateDoc(doc(db, "requests", requestId), updatePayload);

        // 3. Deduct from wallet if wallet payment
        if (selectedPayment === 'wallet' && currentUserId) {
            await updateDoc(doc(db, "users", currentUserId), {
                walletBalance: increment(-(reqData.cost || 0))
            });
        }

        // (اختياري متقدم: يمكنك هنا جلب تقييمات الفني وحساب المتوسط وتحديث ملفه في مجموعة users)

        const successMessages = {
            cash: 'شكراً لتقييمك! ادفع المبلغ للفني نقداً.',
            instapay: 'شكراً! تم رفع الإيصال وسيتم مراجعته.',
            wallet: 'تم الدفع من محفظتك بنجاح! شكراً لتقييمك.'
        };
        showToast(successMessages[selectedPayment] || 'شكراً لتقييمك!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);

    } catch (error) {
        console.error("Error rating:", error);
        showToast('حدث خطأ', 'error');
        btn.disabled = false;
        btn.innerText = 'تأكيد وإرسال التقييم';
    }
});