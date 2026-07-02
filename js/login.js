// js/login.js
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, isUserAdmin } from './shared.js'; // تم إضافة isUserAdmin هنا

// التحقق التلقائي: إذا كان الأدمن/المطور مسجل دخول بالفعل وفتح صفحة اللوجن، نعرض له لوحة التحكم مباشرة
onAuthStateChanged(auth, (user) => {
    // استخدمنا isUserAdmin بدلاً من البحث عن gcode فقط
    if (user && user.email && isUserAdmin(user.email)) {
        showSuperuserSelector();
    }
});

// ==========================================
// 1. منطق تسجيل الدخول الأساسي
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = true;
    loginBtn.innerText = 'جاري تسجيل الدخول...';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // تسجيل الدخول عبر Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // --- التحقق مما إذا كان الحساب ينتمي للإدارة أو المطور ---
        // هنا نستخدم الدالة التي تحتوي على كل إيميلات الإدارة
        if (user.email && isUserAdmin(user.email)) {
            showToast('أهلاً بك في لوحة الإدارة!', 'success');
            showSuperuserSelector();
            return; // إيقاف التوجيه العادي (حتى لا يبحث في قاعدة البيانات)
        }
        // -----------------------------------

        // جلب بيانات المستخدم العادي/الفني لمعرفة دوره (Role) للتوجيه الذكي
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            showToast('تم تسجيل الدخول بنجاح!', 'success');

            // التوجيه الذكي (Smart Routing)
            setTimeout(() => {
                if (userData.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else if (userData.role === 'technician') {
                    if (userData.status === 'pending_docs') {
                        window.location.href = 'verify-identity.html';
                    } else {
                        window.location.href = 'technician/dashboard.html';
                    }
                } else {
                    window.location.href = 'customer/dashboard.html';
                }
            }, 1000);

        } else {
            showToast('بيانات الحساب غير مكتملة.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerText = 'تسجيل الدخول';
        }

    } catch (error) {
        console.error("Error signing in:", error);
        showToast('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'error');
        loginBtn.disabled = false;
        loginBtn.innerText = 'تسجيل الدخول';
    }
});

// ==========================================
// 1.5. تسجيل الدخول بـ Google
// ==========================================
const googleBtn = document.getElementById('google-login-btn');
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        googleBtn.disabled = true;
        googleBtn.innerHTML = '<span class="animate-spin inline-block mr-2">⏳</span> جاري التسجيل...';
        
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if admin
            if (user.email && isUserAdmin(user.email)) {
                showToast('أهلاً بك في لوحة الإدارة!', 'success');
                showSuperuserSelector();
                return;
            }

            // Check if user exists in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                showToast(`أهلاً ${user.displayName || 'بيك'}! 👋`, 'success');
                setTimeout(() => {
                    if (userData.role === 'technician') {
                        window.location.href = 'technician/dashboard.html';
                    } else {
                        window.location.href = 'customer/dashboard.html';
                    }
                }, 1000);
            } else {
                // First time — create customer profile
                await setDoc(userDocRef, {
                    name: user.displayName || 'مستخدم يسطا',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    photoURL: user.photoURL || '',
                    role: 'customer',
                    createdAt: new Date().toISOString(),
                    balance: 0,
                    rating: 5.0,
                    totalOrders: 0
                });
                showToast('تم إنشاء حسابك بنجاح! 🎉', 'success');
                setTimeout(() => {
                    window.location.href = 'customer/dashboard.html';
                }, 1000);
            }
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                showToast('حدث خطأ أثناء تسجيل الدخول بـ Google', 'error');
            }
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5"> تسجيل الدخول بـ Google';
        }
    });
}

// ==========================================
// 2. منطق إعادة تعيين كلمة المرور (Forgot Password)
// ==========================================
const forgotPasswordLink = document.getElementById('forgot-password-link');
const resetModal = document.getElementById('reset-password-modal');
const closeResetModal = document.getElementById('close-reset-modal');
const resetForm = document.getElementById('reset-password-form');
const modalContent = resetModal.querySelector('div');

// فتح النافذة المنبثقة
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetModal.classList.remove('hidden');
    // إضافة حركات بسيطة لظهور النافذة (Animation)
    setTimeout(() => {
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
});

// إغلاق النافذة المنبثقة
function closeModal() {
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        resetModal.classList.add('hidden');
        resetForm.reset();
    }, 200);
}

closeResetModal.addEventListener('click', closeModal);

// إرسال رابط إعادة التعيين
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('send-reset-btn');
    const emailToReset = document.getElementById('reset-email').value;
    
    btn.disabled = true;
    btn.innerText = 'جاري الإرسال...';

    try {
        await sendPasswordResetEmail(auth, emailToReset);
        showToast('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني بنجاح!', 'success');
        closeModal();
    } catch (error) {
        console.error("Error sending reset email:", error);
        
        // رسائل خطأ مخصصة للمستخدم
        let errorMsg = 'حدث خطأ. يرجى التأكد من اتصالك بالإنترنت.';
        if (error.code === 'auth/user-not-found') {
            errorMsg = 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'صيغة البريد الإلكتروني غير صحيحة.';
        }
        
        showToast(errorMsg, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'إرسال الرابط';
    }
});

// ==========================================
// 3. واجهة اختيار المسار لحساب المطور والإدارة
// ==========================================
function showSuperuserSelector() {
    const mainContainer = document.querySelector('.max-w-md');
    if(mainContainer) {
        mainContainer.innerHTML = `
            <div class="text-center mb-6">
                <h1 class="text-3xl font-bold text-purple-600 mb-2">لوحة الإدارة ⚙️</h1>
                <p class="text-gray-500">مرحباً بك، اختر الواجهة التي تريد الدخول إليها:</p>
            </div>
            <div class="space-y-4">
                <button onclick="window.location.href='admin/dashboard.html'" class="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition shadow-md">
                    👑 الدخول كـ إدارة (Admin)
                </button>
                <button onclick="window.location.href='customer/dashboard.html'" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md opacity-80">
                    🧑‍🔧 اختبار واجهة العميل
                </button>
                <button onclick="window.location.href='technician/dashboard.html'" class="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-md opacity-80">
                    🛠️ اختبار واجهة الفني
                </button>
                <button id="admin-logout-btn" class="w-full bg-red-50 text-red-600 font-bold py-3 rounded-lg hover:bg-red-100 transition mt-4 shadow-sm border border-red-100">
                    تسجيل خروج 🚪
                </button>
            </div>
        `;

        // تفعيل وظيفة تسجيل الخروج
        document.getElementById('admin-logout-btn').addEventListener('click', async () => {
            const btn = document.getElementById('admin-logout-btn');
            btn.disabled = true;
            btn.innerText = 'جاري تسجيل الخروج...';
            try {
                await signOut(auth); // تسجيل الخروج من فايربيز
                window.location.reload(); // إعادة تحميل الصفحة لتظهر شاشة اللوجين الطبيعية
            } catch (error) {
                console.error("Logout error:", error);
                showToast('حدث خطأ أثناء تسجيل الخروج', 'error');
                btn.disabled = false;
                btn.innerText = 'تسجيل خروج 🚪';
            }
        });
    }
}