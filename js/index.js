// js/index.js
// js/index.js
import { checkAuthState } from './shared.js';

document.addEventListener('DOMContentLoaded', () => {
    // التحقق من حالة الدخول
    // نمرر false لأن هذه صفحة عامة لا تتطلب تسجيل دخول، 
    // ولكن إذا كان المستخدم مسجلاً بالفعل، ستوجهه دالة checkAuthState للوحة الخاصة به تلقائياً
    // ملاحظة: تأكد من تطوير checkAuthState في shared.js لتوجيه المستخدم حسب دوره إذا كان مسجلاً
    checkAuthState(false);
    
    console.log("تم تحميل الصفحة الرئيسية بنجاح.");
});