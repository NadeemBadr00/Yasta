// js/register.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, fetchCategoriesFromDB } from './shared.js';

const form = document.getElementById('register-form');
const roleRadios = document.querySelectorAll('input[name="role"]');
const techSkillsSection = document.getElementById('tech-skills-section');
const mainCatSelect = document.getElementById('main-category');
// نقوم بإخفاء العناصر الفرعية القديمة لأن الهيكل أصبح أسهل
const subCatContainer = document.getElementById('sub-category-container');
const customCatContainer = document.getElementById('custom-category-container');

// إخفاء العناصر القديمة التي لم نعد بحاجتها في الهيكل الجديد
if(subCatContainer) subCatContainer.style.display = 'none';
if(customCatContainer) customCatContainer.style.display = 'none';

// تغيير النص ليكون أوضح
const mainCatLabel = mainCatSelect.previousElementSibling;
if(mainCatLabel) mainCatLabel.innerText = "التخصص";

// إظهار/إخفاء قسم الفني بناءً على نوع الحساب
roleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'technician') {
            techSkillsSection.classList.remove('hidden');
            mainCatSelect.setAttribute('required', 'true');
        } else {
            techSkillsSection.classList.add('hidden');
            mainCatSelect.removeAttribute('required');
        }
    });
});

// تعبئة التخصصات من قاعدة البيانات
async function loadCategoriesForRegistration() {
    mainCatSelect.innerHTML = '<option value="" disabled selected>جاري التحميل...</option>';
    const dbCategories = await fetchCategoriesFromDB();
    
    mainCatSelect.innerHTML = '<option value="" disabled selected>اختر التخصص...</option>';
    dbCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon || '🛠️'} ${cat.name}`;
        mainCatSelect.appendChild(option);
    });
}

// استدعاء التحميل عند فتح الصفحة
loadCategoriesForRegistration();

// توليد كود إحالة فريد
function generateReferralCode(name) {
    const prefix = name.replace(/\s/g, '').substring(0, 3).toUpperCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 أرقام عشوائية
    return `YASTA-${prefix}-${randomDigits}`;
}

// معالجة الإرسال
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true; btn.innerText = 'جاري الإنشاء...';

    const role = document.querySelector('input[name="role"]:checked').value;
    const name = document.getElementById('name').value;
    const nationalId = document.getElementById('nationalId').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const referralCodeInput = document.getElementById('referral-code').value.trim();

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // توليد كود الإحالة الخاص بالمستخدم الجديد
        const referralCode = generateReferralCode(name);

        // تجهيز بيانات المستخدم للحفظ في قاعدة البيانات
        let userData = {
            name,
            nationalId,
            phone,
            email,
            role,
            referralCode,
            walletBalance: 0,
            referralCount: 0,
            createdAt: serverTimestamp()
        };

        // إضافة بيانات التخصص إذا كان فني (نحفظه في mainCategory للتوافق)
        if (role === 'technician') {
            userData.status = 'pending_identity'; 
            userData.mainCategory = mainCatSelect.value;
        }

        // التحقق من كود الإحالة إذا تم إدخاله
        if (referralCodeInput) {
            try {
                const referralQuery = query(collection(db, 'users'), where('referralCode', '==', referralCodeInput));
                const referralSnap = await getDocs(referralQuery);

                if (!referralSnap.empty) {
                    const referrerDoc = referralSnap.docs[0];
                    const referrerUid = referrerDoc.id;

                    // إضافة بيانات الإحالة للمستخدم الجديد
                    userData.referredBy = referrerUid;
                    userData.firstOrderDiscount = 15;

                    // تحديث بيانات المُحيل (إضافة رصيد + عداد الإحالات)
                    await updateDoc(doc(db, 'users', referrerUid), {
                        walletBalance: increment(20),
                        referralCount: increment(1)
                    });

                    showToast('تم تطبيق كود الإحالة! ستحصل على خصم 15% على أول طلب', 'success');
                } else {
                    showToast('كود الإحالة غير صحيح، تم تجاهله', 'info');
                }
            } catch (refError) {
                console.error('Error processing referral code:', refError);
                showToast('كود الإحالة غير صحيح، تم تجاهله', 'info');
            }
        }

        await setDoc(doc(db, "users", user.uid), userData);

        showToast('تم إنشاء الحساب بنجاح!', 'success');
        
        // التوجيه
        setTimeout(() => {
            if (role === 'customer') window.location.href = 'customer/dashboard.html';
            else window.location.href = 'verify-identity.html';
        }, 1500);

    } catch (error) {
        let msg = 'حدث خطأ غير معروف.';
        if (error.code === 'auth/email-already-in-use') msg = 'البريد الإلكتروني مستخدم بالفعل.';
        if (error.code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة.';
        showToast(msg, 'error');
        btn.disabled = false; btn.innerText = 'إنشاء الحساب';
    }
});