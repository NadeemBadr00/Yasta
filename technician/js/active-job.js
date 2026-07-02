// technician/js/active-job.js
import { auth, db } from '../../js/firebase-config.js';
import { doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showToast, checkAuthState } from '../../js/shared.js';

let currentUser = null;
let watchId = null;
let map = null;
let techMarker = null;
let custMarker = null;
let isMapInit = false;

const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get('requestId');
if (!requestId) window.location.href = 'dashboard.html';

const requestRef = doc(db, "requests", requestId);
checkAuthState(true, null);

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadJobDetails();
        startGpsTracking();
    }
});

function initMap(lat, lng) {
    if (isMapInit) return;
    map = L.map('map', { zoomControl: false }).setView([lat, lng], 14);
    
    // دعم الدارك مود للخريطة
    const tileUrl = document.documentElement.classList.contains('dark') 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
    L.tileLayer(tileUrl, { attribution: '© OpenStreetMap' }).addTo(map);
    
    const custIcon = L.divIcon({ html: '🏠', className: 'text-3xl drop-shadow-md', iconSize: [30, 30] });
    custMarker = L.marker([lat, lng], { icon: custIcon }).addTo(map);
    isMapInit = true;
}

async function loadJobDetails() {
    onSnapshot(requestRef, async (docSnap) => {
        if (!docSnap.exists()) return;
        const req = docSnap.data();
        
        if (!isMapInit && req.location) initMap(req.location.lat, req.location.lng);

        const customerDoc = await getDoc(doc(db, "users", req.customerId));
        const customer = customerDoc.exists() ? customerDoc.data() : { name: 'عميل', phone: '' };

        document.getElementById('job-details').innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-xl font-black text-gray-800 dark:text-white">${customer.name}</h2>
                    <p class="text-gray-500 dark:text-dark-muted text-sm font-bold truncate max-w-[200px]">${req.description || 'بدون وصف'}</p>
                </div>
                <div class="flex gap-2">
                    ${req.imageUrl ? `<a href="${req.imageUrl}" target="_blank" class="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xl hover:bg-gray-200">🖼️</a>` : ''}
                    <a href="tel:${customer.phone}" class="w-10 h-10 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-full flex items-center justify-center text-xl shadow-sm hover:scale-110 transition">📞</a>
                </div>
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${req.location.lat},${req.location.lng}" target="_blank" class="mt-3 w-full block text-center bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 py-2 rounded-xl font-bold hover:bg-gray-200 transition text-sm">
                🗺️ فتح الاتجاهات في خرائط جوجل
            </a>
        `;
        updateButtonsUI(req.status);
    });
}

function startGpsTracking() {
    if (!navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(async (pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude;
        if (map) {
            const techIcon = L.divIcon({ html: '🚙', className: 'text-3xl drop-shadow-lg', iconSize: [30, 30] });
            if (!techMarker) techMarker = L.marker([lat, lng], { icon: techIcon }).addTo(map);
            else techMarker.setLatLng([lat, lng]);
            
            if(custMarker) map.fitBounds(L.latLngBounds([ [lat, lng], custMarker.getLatLng() ]), { padding: [50, 50] });
        }
        await updateDoc(requestRef, { techLocation: { lat, lng } });
    }, null, { enableHighAccuracy: true });
}

function updateButtonsUI(status) {
    const btnOnWay = document.getElementById('btn-on-way');
    const btnArrived = document.getElementById('btn-arrived');
    const btnInProg = document.getElementById('btn-in-progress');
    const compSection = document.getElementById('completion-section');

    [btnOnWay, btnArrived, btnInProg].forEach(b => b.classList.add('hidden'));

    if (status === 'accepted') {
        btnOnWay.classList.remove('hidden'); btnOnWay.onclick = () => updateStatus('on_the_way');
    } else if (status === 'on_the_way') {
        btnArrived.classList.remove('hidden'); btnArrived.onclick = () => updateStatus('arrived');
    } else if (status === 'arrived') {
        btnInProg.classList.remove('hidden'); btnInProg.onclick = () => updateStatus('in_progress');
    } else if (status === 'in_progress') {
        compSection.classList.remove('hidden');
    }
}

async function updateStatus(newStatus) {
    await updateDoc(requestRef, { status: newStatus });
    showToast('تم التحديث بنجاح', 'success');
}

document.getElementById('btn-complete').addEventListener('click', async () => {
    const cost = document.getElementById('final-cost').value;
    if (!cost || cost <= 0) return showToast('برجاء إدخال التكلفة', 'error');
    if (Number(cost) < 50) return showToast('الحد الأدنى للمصنعية هو 50 جنيه', 'error');
    
    await updateDoc(requestRef, { status: 'completed', cost: Number(cost) });
    if (watchId) navigator.geolocation.clearWatch(watchId);
    showToast('تم إنهاء الطلب بنجاح! 🎉', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 2000);
});