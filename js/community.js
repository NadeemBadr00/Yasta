// js/community.js
import { auth, db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, getDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { checkAuthState, showToast, injectBottomNav, fetchCategoriesFromDB } from './shared.js';

let currentUser = null;
let currentUserData = null;
let currentPostIdForComments = null;
let bidModeActive = false;

checkAuthState(true, null);

// ==========================================
// 1. بناء الشريط الجانبي (Sidebar) للفلاتر من Firebase
// ==========================================
const sidebar = document.getElementById('filter-sidebar');
const overlay = document.getElementById('filter-overlay');

function toggleSidebar() {
    sidebar.classList.toggle('translate-x-full');
    overlay.classList.toggle('hidden');
}

document.getElementById('open-filter-sidebar').addEventListener('click', toggleSidebar);
document.getElementById('close-filter-sidebar').addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

async function renderCategoryUI() {
    const sidebarCategories = document.getElementById('sidebar-categories');
    const postCategorySelect = document.getElementById('post-category');
    
    if (!sidebarCategories || !postCategorySelect) return;

    sidebarCategories.innerHTML = '<button class="w-full text-right px-4 py-3 rounded-xl font-bold transition-colors bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 cat-filter-btn active" data-cat="all">🌍 عرض الكل</button>';
    postCategorySelect.innerHTML = '';

    // جلب التخصصات من الداتا بيز بدلاً من الملف الثابت
    const dbCategories = await fetchCategoriesFromDB();

    dbCategories.forEach(cat => {
        // إضافة الخيارات لقائمة النشر
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        postCategorySelect.appendChild(option);

        // إضافة الفلاتر
        const btn = document.createElement('button');
        btn.className = "w-full text-right px-4 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cat-filter-btn";
        btn.dataset.cat = cat.name;
        btn.innerHTML = `${cat.icon || '🛠️'} ${cat.name}`;
        sidebarCategories.appendChild(btn);
    });

    // تفعيل أزرار السايدبار
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-filter-btn').forEach(b => {
                b.classList.remove('bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400', 'active');
                b.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-slate-800');
            });
            
            const target = e.currentTarget;
            target.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-slate-800');
            target.classList.add('bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400', 'active');
            
            renderPosts(target.dataset.cat);
            
            if(window.innerWidth < 768) toggleSidebar();
        });
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        document.querySelector('.cat-filter-btn[data-cat="all"]').click();
    });
}

// استدعاء البناء
renderCategoryUI();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                currentUserData = userDoc.data();
                
                document.getElementById('add-post-btn').classList.remove('hidden');

                if (currentUserData.role === 'customer') {
                    injectBottomNav('customer', 'community'); 
                } else if (currentUserData.role === 'technician') {
                    injectBottomNav('technician', 'community');
                } else {
                    injectBottomNav('customer', 'community');
                }
            } else {
                injectBottomNav('customer', 'community');
            }
        } catch(e) {
            console.warn('خطأ في جلب بيانات المستخدم:', e);
            injectBottomNav('customer', 'community');
        }
        
        loadPosts();

        // Show bid toggle for technicians
        if (currentUserData && currentUserData.role === 'technician') {
            document.getElementById('bid-toggle-wrapper').classList.remove('hidden');
        }
    }
});

// ==========================================
// Bid Mode Toggle Logic
// ==========================================
const bidToggleBtn = document.getElementById('bid-toggle-btn');
const bidFields = document.getElementById('bid-fields');
const commentSendBtn = document.getElementById('comment-send-btn');

bidToggleBtn.addEventListener('click', () => {
    bidModeActive = !bidModeActive;
    if (bidModeActive) {
        bidFields.classList.remove('hidden');
        bidToggleBtn.classList.remove('bg-gray-100', 'dark:bg-slate-800', 'text-gray-600', 'dark:text-gray-300', 'border-gray-200');
        bidToggleBtn.classList.add('bg-green-100', 'dark:bg-green-900/30', 'text-green-700', 'dark:text-green-400', 'border-green-400');
        commentSendBtn.classList.remove('bg-primary-600', 'hover:bg-primary-700');
        commentSendBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        document.getElementById('comment-text').placeholder = 'وصف العرض (مثلاً: شامل قطع الغيار)...';
    } else {
        bidFields.classList.add('hidden');
        bidToggleBtn.classList.add('bg-gray-100', 'dark:bg-slate-800', 'text-gray-600', 'dark:text-gray-300', 'border-gray-200');
        bidToggleBtn.classList.remove('bg-green-100', 'dark:bg-green-900/30', 'text-green-700', 'dark:text-green-400', 'border-green-400');
        commentSendBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
        commentSendBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        document.getElementById('comment-text').placeholder = 'اكتب تعليقك أو عرضك...';
        document.getElementById('bid-price').value = '';
        document.getElementById('bid-duration').value = '';
    }
});

// ==========================================
// إدارة المنشورات (Posts)
// ==========================================
const postsContainer = document.getElementById('posts-container');
let allPosts = []; 

function loadPosts() {
    onSnapshot(collection(db, "posts"), (snapshot) => {
        allPosts = [];
        snapshot.forEach(doc => {
            allPosts.push({ id: doc.id, ...doc.data() });
        });
        
        allPosts.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });

        const activeFilter = document.querySelector('.cat-filter-btn.active.bg-primary-50')?.dataset.cat || 'all';
        renderPosts(activeFilter);
    });
}

function renderPosts(filterCategory) {
    postsContainer.innerHTML = '';
    const filtered = filterCategory === 'all' ? allPosts : allPosts.filter(p => p.category === filterCategory);

    if (filtered.length === 0) {
        postsContainer.innerHTML = '<div class="text-center py-10 text-gray-500 bg-white dark:bg-dark-card rounded-2xl border border-dashed dark:border-dark-border">لا توجد طلبات حالياً في هذا القسم.</div>';
        return;
    }

    filtered.forEach(post => {
        const timeAgo = post.createdAt ? calculateTimeAgo(post.createdAt.toDate()) : 'الآن';
        const isMyPost = (post.userId === currentUser.uid) || (post.customerId === currentUser.uid); 
        const isTechPost = post.userRole === 'technician';
        
        const card = document.createElement('div');
        card.className = `bg-white dark:bg-dark-card p-5 rounded-2xl shadow-sm border ${isTechPost ? 'border-green-100 dark:border-green-900/30' : 'border-gray-100 dark:border-dark-border'}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 ${isTechPost ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'} rounded-full flex items-center justify-center font-bold text-lg">
                        ${post.customerName.charAt(0)}
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-sm text-gray-900 dark:text-white">${post.customerName}</h3>
                            <span class="text-[9px] px-1.5 py-0.5 rounded font-black ${isTechPost ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${isTechPost ? '🛠️ فني' : '🧑‍🔧 عميل'}</span>
                        </div>
                        <p class="text-[10px] text-gray-500 mt-0.5">${timeAgo} • ${post.category}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="bg-gray-100 dark:bg-slate-800 text-xs px-2 py-1 rounded font-bold">${post.category}</span>
                    ${isMyPost ? `<button onclick="deletePost('${post.id}')" class="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-900/20 text-[10px] font-bold px-2 py-1 rounded transition">حذف 🗑️</button>` : ''}
                </div>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">${post.description}</p>
            
            <div class="border-t dark:border-dark-border pt-3 flex justify-between items-center">
                <button onclick="openComments('${post.id}')" class="text-primary-600 dark:text-primary-400 text-sm font-bold flex items-center gap-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition">
                    💬 التعليقات وتقديم العروض
                </button>
            </div>
        `;
        postsContainer.appendChild(card);
    });
}

window.deletePost = async (postId) => {
    if(!confirm('هل أنت متأكد من حذف هذا المنشور نهائياً؟')) return;
    try {
        await deleteDoc(doc(db, "posts", postId));
        showToast('تم حذف المنشور بنجاح', 'info');
    } catch (error) {
        showToast('حدث خطأ أثناء الحذف', 'error');
    }
};

const postModal = document.getElementById('post-modal');
document.getElementById('add-post-btn').addEventListener('click', () => postModal.classList.remove('hidden'));
document.getElementById('close-post-modal').addEventListener('click', () => postModal.classList.add('hidden'));

document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-post');
    btn.disabled = true; btn.innerText = 'جاري النشر...';

    try {
        await addDoc(collection(db, "posts"), {
            userId: currentUser.uid, 
            customerId: currentUser.uid, 
            customerName: currentUserData.name,
            userRole: currentUserData.role, 
            category: document.getElementById('post-category').value,
            description: document.getElementById('post-desc').value,
            createdAt: serverTimestamp()
        });
        showToast('تم نشر المنشور بنجاح', 'success');
        postModal.classList.add('hidden');
        document.getElementById('post-form').reset();
    } catch (error) {
        showToast('حدث خطأ', 'error');
    } finally {
        btn.disabled = false; btn.innerText = 'نشر';
    }
});

// ==========================================
// نظام التعليقات
// ==========================================
const commentsModal = document.getElementById('comments-modal');
let unsubscribeComments = null;

window.openComments = (postId) => {
    currentPostIdForComments = postId;
    commentsModal.classList.remove('hidden');

    // Reset bid mode when opening comments
    bidModeActive = false;
    bidFields.classList.add('hidden');
    bidToggleBtn.classList.add('bg-gray-100', 'dark:bg-slate-800', 'text-gray-600', 'dark:text-gray-300', 'border-gray-200');
    bidToggleBtn.classList.remove('bg-green-100', 'dark:bg-green-900/30', 'text-green-700', 'dark:text-green-400', 'border-green-400');
    commentSendBtn.classList.add('bg-primary-600', 'hover:bg-primary-700');
    commentSendBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    document.getElementById('comment-text').placeholder = 'اكتب تعليقك أو عرضك...';
    document.getElementById('bid-price').value = '';
    document.getElementById('bid-duration').value = '';
    
    if (unsubscribeComments) unsubscribeComments(); 
    
    unsubscribeComments = onSnapshot(collection(db, "comments"), (snapshot) => {
        const commentsList = document.getElementById('comments-list');
        const comments = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.postId === postId) comments.push({ id: doc.id, ...data });
        });

        comments.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
            return timeA - timeB; 
        });

        commentsList.innerHTML = '';
        if(comments.length === 0) {
            commentsList.innerHTML = '<div class="text-center text-gray-400 text-sm mt-10">كن أول من يعلق!</div>';
        }

        // Find the post to check ownership
        const currentPost = allPosts.find(p => p.id === postId);
        const isPostOwner = currentPost && (currentPost.userId === currentUser.uid || currentPost.customerId === currentUser.uid);

        comments.forEach(c => {
            const isMe = c.userId === currentUser.uid;
            const isTech = c.userRole === 'technician';
            
            const div = document.createElement('div');

            if (c.isBid) {
                // === Bid Card Rendering ===
                div.className = 'flex justify-start';
                div.innerHTML = `
                    <div class="max-w-[90%] w-full rounded-2xl overflow-hidden border-r-4 border-green-500 shadow-md">
                        <div class="bg-gradient-to-l from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 px-4 py-3">
                            <div class="flex items-center justify-between mb-2">
                                <p class="text-[10px] font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                                    🛠️ ${c.userName} <span class="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-[8px] px-1.5 py-0.5 rounded-full font-black">عرض سعر</span>
                                </p>
                            </div>
                            <div class="flex items-center gap-3 mb-2">
                                <div class="bg-green-600 text-white px-3 py-1.5 rounded-xl text-center">
                                    <p class="text-lg font-black leading-none">${c.bidPrice}</p>
                                    <p class="text-[8px] opacity-80">جنيه</p>
                                </div>
                                <div class="bg-white/60 dark:bg-slate-800/60 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-xl text-center">
                                    <p class="text-sm font-bold text-green-800 dark:text-green-300">⏱️ ${c.bidDuration}</p>
                                </div>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${c.text}</p>
                            ${isPostOwner && !isMe ? `
                                <button onclick="acceptBid('${postId}', '${c.id}', '${c.userId}', ${c.bidPrice}, '${c.text}')" class="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-sm transition active:scale-95 flex items-center justify-center gap-1">
                                    ✅ قبول العرض
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            } else {
                // === Regular Comment Rendering (unchanged) ===
                div.className = `flex ${isMe ? 'justify-end' : 'justify-start'}`;
                div.innerHTML = `
                    <div class="max-w-[85%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border dark:border-dark-border rounded-bl-none'}">
                        <p class="text-[10px] font-bold ${isMe ? 'text-primary-100' : (isTech ? 'text-green-600' : 'text-gray-500')} mb-1 flex items-center gap-1">
                            ${isTech ? '🛠️' : '👤'} ${c.userName}
                        </p>
                        <p class="text-sm leading-relaxed">${c.text}</p>
                    </div>
                `;
            }
            commentsList.appendChild(div);
        });
        
        commentsList.scrollTop = commentsList.scrollHeight;
    });
};

document.getElementById('close-comments').addEventListener('click', () => {
    commentsModal.classList.add('hidden');
    if (unsubscribeComments) unsubscribeComments();
});

document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-text');
    const text = input.value.trim();
    if (!text) return;

    // Build comment data
    const commentData = {
        postId: currentPostIdForComments,
        userId: currentUser.uid,
        userName: currentUserData.name,
        userRole: currentUserData.role,
        text: text,
        createdAt: serverTimestamp()
    };

    // If bid mode is active, add bid fields
    if (bidModeActive) {
        const price = document.getElementById('bid-price').value;
        const duration = document.getElementById('bid-duration').value.trim();

        if (!price || Number(price) <= 0) {
            showToast('من فضلك أدخل سعر صحيح', 'error');
            return;
        }
        if (!duration) {
            showToast('من فضلك أدخل المدة المتوقعة', 'error');
            return;
        }

        commentData.isBid = true;
        commentData.bidPrice = Number(price);
        commentData.bidDuration = duration;
    }

    input.value = '';
    
    try {
        await addDoc(collection(db, "comments"), commentData);

        // Reset bid mode after successful bid submission
        if (bidModeActive) {
            bidToggleBtn.click(); // Toggle off
            showToast('تم إرسال عرض السعر بنجاح ✅', 'success');
        }
    } catch (error) {
        showToast('فشل إرسال التعليق', 'error');
    }
});

// ==========================================
// Accept Bid Flow
// ==========================================
window.acceptBid = async (postId, commentId, technicianId, bidPrice, bidText) => {
    if (!confirm('هل أنت متأكد من قبول هذا العرض؟')) return;

    try {
        // Get the post details
        const post = allPosts.find(p => p.id === postId);
        if (!post) {
            showToast('لم يتم العثور على المنشور', 'error');
            return;
        }

        showToast('جاري تحديد موقعك...', 'info');

        // Get GPS location
        let location = { lat: 30.0444, lng: 31.2357 }; // Default Cairo
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });
            location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (geoError) {
            console.warn('Geolocation failed, using default location:', geoError);
        }

        // Create request in Firestore
        const newRequest = await addDoc(collection(db, "requests"), {
            customerId: currentUser.uid,
            technicianId: technicianId,
            category: post.category,
            description: `${post.description}\n---\nعرض الفني: ${bidText}`,
            status: 'accepted',
            cost: bidPrice,
            location: location,
            source: 'community_bid',
            createdAt: serverTimestamp()
        });

        showToast('تم قبول العرض! جاري توجيهك لتتبع الفني...', 'success');

        // Redirect to tracking page after short delay
        setTimeout(() => {
            window.location.href = `customer/tracking.html?requestId=${newRequest.id}`;
        }, 1500);

    } catch (error) {
        console.error('Accept bid error:', error);
        showToast('حدث خطأ أثناء قبول العرض', 'error');
    }
};

function calculateTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "الآن";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
}