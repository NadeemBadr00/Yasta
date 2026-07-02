// js/verify-identity.js
// js/verify-identity.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { showToast } from './shared.js';

let currentUser = null;

// التحقق من أن المستخدم مسجل دخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.href = 'login.html';
    }
});

document.getElementById('verify-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const submitBtn = document.getElementById('submit-docs-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'جاري رفع المستندات (برجاء الانتظار)...';

    const idFrontFile = document.getElementById('idFront').files[0];
    const idBackFile = document.getElementById('idBack').files[0];
    const criminalRecordFile = document.getElementById('criminalRecord').files[0];

    try {
        // دالة مساعدة لرفع الملف وجلب الرابط
        const uploadFile = async (file, folderName) => {
            const fileRef = ref(storage, `verifications/${currentUser.uid}/${folderName}_${file.name}`);
            await uploadBytes(fileRef, file);
            return await getDownloadURL(fileRef);
        };

        // رفع الملفات لـ Firebase Storage
        const idFrontUrl = await uploadFile(idFrontFile, 'id_front');
        const idBackUrl = await uploadFile(idBackFile, 'id_back');
        const criminalRecordUrl = await uploadFile(criminalRecordFile, 'criminal_record');

        // تحديث بيانات المستخدم في Firestore
        await updateDoc(doc(db, "users", currentUser.uid), {
            idFrontUrl: idFrontUrl,
            idBackUrl: idBackUrl,
            criminalRecordUrl: criminalRecordUrl,
            status: 'pending_admin_approval' // جاري مراجعة الإدارة
        });

        showToast('تم رفع المستندات بنجاح. حسابك الآن قيد المراجعة!', 'success');

        // توجيه الفني للوحة التحكم الخاصة به (والتي ستخبره أن حسابه قيد المراجعة)
        setTimeout(() => {
            window.location.href = 'technician/dashboard.html';
        }, 2000);

    } catch (error) {
        console.error("Error uploading documents:", error);
        showToast('حدث خطأ أثناء رفع المستندات. تأكد من اتصالك بالإنترنت.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'رفع المستندات وإرسال للمراجعة';
    }
});