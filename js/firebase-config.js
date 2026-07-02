// استدعاء دوال فايربيز الأساسية باستخدام روابط CDN لتعمل مباشرة في المتصفح
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// إعدادات مشروعك على فايربيز
const firebaseConfig = {
  apiKey: "AIzaSyA6WQKgXjdqe3ghQEQ5EXAMZM7ffiWlabk",
  authDomain: "ai-roadmap-jnadeem.firebaseapp.com",
  projectId: "ai-roadmap-jnadeem",
  storageBucket: "ai-roadmap-jnadeem.firebasestorage.app",
  messagingSenderId: "332299268804",
  appId: "1:332299268804:web:225b27d243845688194f91",
  measurementId: "G-P8E119RZDX"
};

// تهيئة المشروع (Initialize Firebase)
const app = initializeApp(firebaseConfig);

// تهيئة الخدمات التي سنستخدمها
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// تصدير الخدمات لكي نتمكن من استخدامها في جميع ملفات المشروع الأخرى
export { app, auth, db, storage };