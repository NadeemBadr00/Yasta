// customer/js/finding-technician.js
// 3-State Flow: Searching → Tech List → Confirmed
import { auth, db } from '../../js/firebase-config.js';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, where, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showToast, injectBottomNav } from '../../js/shared.js';

// ============================================
// Auth Guard
// ============================================
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    if (user) currentUser = user;
    else window.location.href = '../login.html';
});

injectBottomNav('customer', 'finding');

// ============================================
// Extract requestId from URL
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get('requestId');
if (!requestId) window.location.href = 'dashboard.html';

const requestRef = doc(db, "requests", requestId);

// ============================================
// DOM References
// ============================================
const searchingState = document.getElementById('searching-state');
const techListState  = document.getElementById('tech-list-state');
const foundState     = document.getElementById('found-state');
const techsContainer = document.getElementById('techs-container');
const noTechsMsg     = document.getElementById('no-techs-msg');

// ============================================
// Utility: Calculate distance between two GPS coords (km)
// ============================================
function calcDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// Utility: Generate star rating HTML
// ============================================
function starsHtml(rating) {
    const full  = Math.floor(rating);
    const half  = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ============================================
// STATE TRANSITIONS
// ============================================

/** Hide a state element with exit animation */
function hideState(el) {
    return new Promise(resolve => {
        el.classList.add('state-exit');
        el.addEventListener('animationend', () => {
            el.classList.add('hidden');
            el.classList.remove('state-exit');
            resolve();
        }, { once: true });
    });
}

/** Show a state element with enter animation */
function showState(el) {
    el.classList.remove('hidden');
    el.classList.add('state-enter');
    el.addEventListener('animationend', () => {
        el.classList.remove('state-enter');
    }, { once: true });
}

// ============================================
// STATE 2 → Show Technician List
// ============================================
async function showTechList() {
    // 1. Get the request data to know the category & location
    let requestData = {};
    try {
        const reqSnap = await getDoc(requestRef);
        if (reqSnap.exists()) requestData = reqSnap.data();
    } catch (e) {
        console.warn("Could not read request data:", e);
    }

    const category = requestData.category || requestData.mainCategory || '';
    const customerLat = requestData.location?.lat || requestData.lat || null;
    const customerLng = requestData.location?.lng || requestData.lng || null;

    // 2. Query Firestore for matching technicians
    let technicians = [];
    try {
        // Try with 'verified' status first
        let q = query(
            collection(db, "users"),
            where("role", "==", "technician"),
            where("status", "in", ["verified", "approved"])
        );

        // If we have a category, add it as a filter
        if (category) {
            q = query(
                collection(db, "users"),
                where("role", "==", "technician"),
                where("status", "in", ["verified", "approved"]),
                where("mainCategory", "==", category)
            );
        }

        const snap = await getDocs(q);
        snap.forEach(docSnap => {
            const data = docSnap.data();
            let distance = null;
            if (customerLat && customerLng && data.location) {
                const techLat = data.location.lat || data.location.latitude;
                const techLng = data.location.lng || data.location.longitude;
                if (techLat && techLng) {
                    distance = calcDistanceKm(customerLat, customerLng, techLat, techLng);
                }
            }
            technicians.push({
                id: docSnap.id,
                name: data.fullName || data.name || data.displayName || 'فني',
                category: data.mainCategory || data.category || category || 'فني صيانة',
                rating: data.rating || data.averageRating || 0,
                totalJobs: data.totalJobs || data.completedJobs || 0,
                distance: distance,
                photoURL: data.photoURL || data.profileImage || null,
                phone: data.phone || null
            });
        });

        // Sort by distance (nearest first), then by rating
        technicians.sort((a, b) => {
            if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
            if (a.distance !== null) return -1;
            if (b.distance !== null) return 1;
            return (b.rating || 0) - (a.rating || 0);
        });

    } catch (error) {
        console.error("Error querying technicians:", error);
        
        // Fallback: try simpler query without compound index
        try {
            const fallbackQ = query(
                collection(db, "users"),
                where("role", "==", "technician")
            );
            const fallbackSnap = await getDocs(fallbackQ);
            fallbackSnap.forEach(docSnap => {
                const data = docSnap.data();
                const status = data.status || '';
                if (status !== 'verified' && status !== 'approved') return;
                if (category && data.mainCategory !== category) return;
                
                let distance = null;
                if (customerLat && customerLng && data.location) {
                    const techLat = data.location.lat || data.location.latitude;
                    const techLng = data.location.lng || data.location.longitude;
                    if (techLat && techLng) {
                        distance = calcDistanceKm(customerLat, customerLng, techLat, techLng);
                    }
                }
                technicians.push({
                    id: docSnap.id,
                    name: data.fullName || data.name || data.displayName || 'فني',
                    category: data.mainCategory || data.category || category || 'فني صيانة',
                    rating: data.rating || data.averageRating || 0,
                    totalJobs: data.totalJobs || data.completedJobs || 0,
                    distance: distance,
                    photoURL: data.photoURL || data.profileImage || null,
                    phone: data.phone || null
                });
            });
            technicians.sort((a, b) => {
                if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
                if (a.distance !== null) return -1;
                if (b.distance !== null) return 1;
                return (b.rating || 0) - (a.rating || 0);
            });
        } catch (fallbackError) {
            console.error("Fallback query also failed:", fallbackError);
        }
    }

    // 3. Animate transition: Searching → Tech List
    await hideState(searchingState);

    // 4. Render technician cards
    techsContainer.innerHTML = '';

    if (technicians.length === 0) {
        noTechsMsg.classList.remove('hidden');
    } else {
        noTechsMsg.classList.add('hidden');
        technicians.forEach((tech, index) => {
            const distanceText = tech.distance !== null
                ? `${tech.distance.toFixed(1)} كم`
                : 'غير محدد';

            const ratingDisplay = tech.rating > 0 ? tech.rating.toFixed(1) : 'جديد';
            const avatarUrl = tech.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=random&color=fff&size=128&font-size=0.4&bold=true`;

            const card = document.createElement('div');
            card.className = "tech-card bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer";
            card.style.animationDelay = `${index * 80}ms`;
            card.classList.add('slide-up');
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');

            card.innerHTML = `
                <img src="${avatarUrl}" alt="${tech.name}"
                     class="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-slate-600 flex-shrink-0"
                     onerror="this.src='https://ui-avatars.com/api/?name=F&background=3b82f6&color=fff'">
                <div class="flex-grow min-w-0">
                    <h3 class="font-black text-lg text-gray-900 dark:text-white truncate">${tech.name}</h3>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
                        <span class="text-yellow-500">⭐ ${ratingDisplay}</span>
                        <span>•</span>
                        <span>📍 ${distanceText}</span>
                        ${tech.totalJobs > 0 ? `<span>• 🔧 ${tech.totalJobs} طلب</span>` : ''}
                    </div>
                    <span class="inline-block mt-1.5 text-[11px] font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2.5 py-0.5 rounded-lg">${tech.category}</span>
                </div>
                <button class="select-tech-btn bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-black px-4 py-2.5 rounded-xl text-sm hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white transition-colors flex-shrink-0">
                    اختيار
                </button>
            `;

            // Click handler for the entire card or the button
            const handleSelect = (e) => {
                e.stopPropagation();
                confirmTechSelection(tech);
            };
            card.addEventListener('click', handleSelect);
            card.querySelector('.select-tech-btn').addEventListener('click', handleSelect);

            techsContainer.appendChild(card);
        });
    }

    showState(techListState);
}

// ============================================
// STATE 3 → Confirm Tech Selection
// ============================================
async function confirmTechSelection(tech) {
    // Update the found-state card info
    document.getElementById('tech-name').textContent = tech.name;
    document.getElementById('tech-job').textContent = `فني ${tech.category}`;
    document.getElementById('tech-rating-badge').innerHTML = `⭐ ${tech.rating > 0 ? tech.rating.toFixed(1) : 'جديد'}`;

    const avatarUrl = tech.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=2563eb&color=fff&size=256`;
    document.getElementById('tech-img').src = avatarUrl;

    // Animate transition: Tech List → Found
    await hideState(techListState);
    showState(foundState);

    showToast('تم تأكيد الفني بنجاح! 🎉', 'success');

    // Update Firestore with selected technician
    try {
        await updateDoc(requestRef, {
            status: 'accepted',
            technicianId: tech.id,
            techName: tech.name,
            techPhone: tech.phone || null,
            acceptedAt: new Date().toISOString()
        });
    } catch (error) {
        console.warn("Could not update request (permissions):", error);
    }

    // Redirect to tracking after 3 seconds
    setTimeout(() => {
        window.location.href = `tracking.html?requestId=${requestId}`;
    }, 3000);
}

// ============================================
// Real-time listener: If a tech accepts FIRST
// (before customer picks), auto-redirect
// ============================================
const unsubscribe = onSnapshot(requestRef, (docSnap) => {
    if (docSnap.exists()) {
        const req = docSnap.data();
        // If tech accepted externally (from tech portal)
        if (req.status === 'accepted' && req.technicianId && !foundState.classList.contains('state-enter')) {
            // Only auto-redirect if we're still in searching state
            if (!searchingState.classList.contains('hidden')) {
                showToast('تم العثور على فني! هو الآن في الطريق إليك.', 'success');
                unsubscribe();
                setTimeout(() => {
                    window.location.href = `tracking.html?requestId=${requestId}`;
                }, 2000);
            }
        }
    } else {
        // Request doesn't exist — might be demo/test mode
        console.warn('Request document not found:', requestId);
    }
});

// ============================================
// Cancel Handlers
// ============================================
async function handleCancel() {
    if (!confirm('هل أنت متأكد من إلغاء الطلب؟')) return;
    try {
        await deleteDoc(requestRef);
        showToast('تم إلغاء الطلب.', 'info');
    } catch (error) {
        console.error("Error cancelling request:", error);
    }
    window.location.href = 'dashboard.html';
}

document.getElementById('cancel-btn').addEventListener('click', handleCancel);
document.getElementById('cancel-list-btn').addEventListener('click', handleCancel);

// ============================================
// BOOT: Start searching, then show tech list
// ============================================
// Show radar for a few seconds, then query and display techs
setTimeout(() => {
    showTechList();
}, 3500);