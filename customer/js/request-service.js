// customer/js/request-service.js
import { auth, db, storage } from '../../js/firebase-config.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showToast, injectBottomNav } from '../../js/shared.js';
import { analyzeIssueImage, analyzeIssueText } from '../../js/gemini-diagnosis.js';

let currentUser = null;
onAuthStateChanged(auth, (user) => {
    if (user) currentUser = user;
    else window.location.href = '../login.html';
});

injectBottomNav('customer', 'request');

// استخراج اسم التخصص من الرابط
const urlParams = new URLSearchParams(window.location.search);
const categoryName = urlParams.get('category');
if (!categoryName) window.location.href = 'dashboard.html';
document.getElementById('category-title').innerText = categoryName;

// AI Diagnosis state
let aiDiagnosis = null;

// ==========================================
// Package selection state
// ==========================================
let selectedPackage = null;
let isPackageMode = false;

// Toggle buttons
const toggleOpen = document.getElementById('toggle-open');
const togglePackage = document.getElementById('toggle-package');
const openSection = document.getElementById('open-section');
const packagesSection = document.getElementById('packages-section');
const packagesGrid = document.getElementById('packages-grid');

if (toggleOpen && togglePackage) {
    toggleOpen.addEventListener('click', () => {
        isPackageMode = false;
        selectedPackage = null;
        toggleOpen.className = 'flex-1 py-3 text-sm font-black text-center transition-all bg-primary-600 text-white';
        togglePackage.className = 'flex-1 py-3 text-sm font-black text-center transition-all bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400';
        openSection.classList.remove('hidden');
        packagesSection.classList.add('hidden');
        // Deselect any package card
        document.querySelectorAll('.package-card').forEach(c => c.classList.remove('ring-2', 'ring-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20'));
    });

    togglePackage.addEventListener('click', () => {
        isPackageMode = true;
        togglePackage.className = 'flex-1 py-3 text-sm font-black text-center transition-all bg-primary-600 text-white';
        toggleOpen.className = 'flex-1 py-3 text-sm font-black text-center transition-all bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400';
        openSection.classList.add('hidden');
        packagesSection.classList.remove('hidden');
        // Load packages if not yet loaded
        if (packagesGrid && packagesGrid.dataset.loaded !== 'true') {
            loadPackages(categoryName);
        }
    });
}

// Load packages for the current category from Firestore
async function loadPackages(catName) {
    if (!packagesGrid) return;
    packagesGrid.innerHTML = '<div class="col-span-2 text-center py-6 text-gray-400 dark:text-dark-muted font-bold text-sm animate-pulse">جاري تحميل الباقات...</div>';

    try {
        const q = query(collection(db, 'packages'), where('category', '==', catName), where('isActive', '==', true));
        const snap = await getDocs(q);

        if (snap.empty) {
            packagesGrid.innerHTML = '<div class="col-span-2 text-center py-6 text-gray-400 dark:text-dark-muted font-bold text-sm">لا توجد باقات متاحة لهذا التخصص حالياً</div>';
            return;
        }

        packagesGrid.innerHTML = '';
        snap.forEach(doc => {
            const pkg = { id: doc.id, ...doc.data() };
            const card = document.createElement('div');
            card.className = 'package-card bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.97]';
            card.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-3xl drop-shadow-sm">${pkg.icon || '📦'}</span>
                    <div class="flex-1">
                        <h4 class="font-black text-gray-800 dark:text-white text-sm">${pkg.name}</h4>
                        ${pkg.duration ? `<p class="text-xs text-gray-400 dark:text-dark-muted font-bold">⏱ ${pkg.duration}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center justify-between mt-2">
                    <span class="font-black text-green-600 dark:text-green-400 text-lg">${pkg.price} ج.م</span>
                    <span class="text-xs text-gray-400 font-bold">سعر ثابت</span>
                </div>
            `;

            card.addEventListener('click', () => {
                // Deselect all
                document.querySelectorAll('.package-card').forEach(c => {
                    c.classList.remove('ring-2', 'ring-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                });
                // Select this card
                card.classList.add('ring-2', 'ring-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20');
                selectedPackage = { name: pkg.name, price: pkg.price };
            });

            packagesGrid.appendChild(card);
        });
        packagesGrid.dataset.loaded = 'true';
    } catch (error) {
        console.error('Error loading packages:', error);
        packagesGrid.innerHTML = '<div class="col-span-2 text-center py-6 text-red-400 font-bold text-sm">خطأ في تحميل الباقات</div>';
    }
}

// AI Analyze button handler
const analyzeBtn = document.getElementById('analyze-btn');
if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
        const imageFile = document.getElementById('issue-image').files[0];
        const descText = document.getElementById('issue-desc').value.trim();

        // يشتغل بالصورة أو بالنص — المهم يكون فيه حاجة
        if (!imageFile && !descText) {
            showToast('أضف صورة أو اكتب وصف للعطل أولاً', 'error');
            return;
        }

        const aiLoading = document.getElementById('ai-loading');
        const aiResults = document.getElementById('ai-results');
        const aiResultsText = document.getElementById('ai-results-text');

        // Show loading, hide previous results
        analyzeBtn.classList.add('hidden');
        aiLoading.classList.remove('hidden');
        aiResults.classList.add('hidden');

        try {
            let diagnosis;

            if (imageFile) {
                // Read image as base64
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result.split(',')[1];
                        resolve(result);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });

                // تحليل بالصورة — Gemini Vision
                diagnosis = await analyzeIssueImage(base64, categoryName);
            } else {
                // تحليل بالنص فقط — بدون صورة
                diagnosis = await analyzeIssueText(descText, categoryName);
            }

            aiDiagnosis = diagnosis;

            // Display results
            aiResultsText.textContent = diagnosis;
            aiResults.classList.remove('hidden');

        } catch (error) {
            console.error('AI Analysis failed:', error);
            showToast(error.message || 'فشل التحليل الذكي', 'error');
            analyzeBtn.classList.remove('hidden');
        } finally {
            aiLoading.classList.add('hidden');
        }
    });
}

document.getElementById('request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate package selection in package mode
    if (isPackageMode && !selectedPackage) {
        showToast('يرجى اختيار باقة أولاً', 'error');
        return;
    }

    const submitBtn = document.getElementById('submit-request-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'جاري تحديد الموقع...';

    // 1. جلب الموقع الجغرافي (GPS)
    if (!navigator.geolocation) {
        showToast('متصفحك لا يدعم تحديد الموقع.', 'error');
        submitBtn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        submitBtn.innerText = 'جاري إرسال الطلب...';
        
        try {
            const desc = document.getElementById('issue-desc').value;
            const imageFile = document.getElementById('issue-image').files[0];
            let imageUrl = null;

            // 2. رفع الصورة إن وجدت
            if (imageFile) {
                const imageRef = ref(storage, `requests/${currentUser.uid}_${Date.now()}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }

            // 3. إنشاء الطلب في Firestore
            const requestData = {
                customerId: currentUser.uid,
                category: categoryName,
                description: desc,
                imageUrl: imageUrl,
                location: { lat: lat, lng: lng },
                status: 'searching', // حالة الانتظار
                createdAt: serverTimestamp()
            };

            // Include AI diagnosis if available
            if (aiDiagnosis) {
                requestData.aiDiagnosis = aiDiagnosis;
            }

            // If a package is selected, add package data
            if (isPackageMode && selectedPackage) {
                requestData.requestType = 'package';
                requestData.packageName = selectedPackage.name;
                requestData.packagePrice = selectedPackage.price;
            } else {
                requestData.requestType = 'open';
            }

            const docRef = await addDoc(collection(db, "requests"), requestData);

            // 4.5 إرسال إشعارات للفنيين المتاحين في نفس التخصص
            try {
                const techQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'technician'),
                    where('category', '==', categoryName)
                );
                const techSnap = await getDocs(techQuery);

                const notifPromises = [];
                techSnap.forEach(techDoc => {
                    const techData = techDoc.data();
                    // إنشاء سجل إشعار لكل فني في التخصص
                    const notifRef = collection(db, 'notifications', techDoc.id, 'items');
                    notifPromises.push(
                        addDoc(notifRef, {
                            title: '🔔 طلب جديد!',
                            body: `طلب ${requestData.requestType === 'package' ? 'باقة' : 'مفتوح'} في تخصص ${categoryName}`,
                            requestId: docRef.id,
                            read: false,
                            createdAt: serverTimestamp()
                        })
                    );
                });

                await Promise.all(notifPromises);
                console.log(`✅ تم إرسال إشعارات لـ ${techSnap.size} فنيين`);
            } catch (notifError) {
                // لا نوقف العملية إذا فشل إرسال الإشعارات
                console.warn('تعذر إرسال الإشعارات للفنيين:', notifError);
            }

            // 5. توجيه العميل لشاشة "الرادار" أو الانتظار مع تمرير رقم الطلب
            window.location.href = `finding-technician.html?requestId=${docRef.id}`;

        } catch (error) {
            console.error("Error creating request:", error);
            showToast('حدث خطأ أثناء إرسال الطلب', 'error');
            submitBtn.disabled = false;
            submitBtn.innerText = 'تحديد موقعي والبحث عن فني';
        }

    }, (error) => {
        console.error("GPS Error:", error);
        showToast('يرجى السماح للتطبيق بالوصول لموقعك الجغرافي.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'تحديد موقعي والبحث عن فني';
    });
});