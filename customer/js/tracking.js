// customer/js/tracking.js
import { auth, db } from '../../js/firebase-config.js';
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { checkAuthState, injectBottomNav } from '../../js/shared.js';

const urlParams = new URLSearchParams(window.location.search);
const requestId = urlParams.get('requestId');
if (!requestId) window.location.href = 'dashboard.html';

let map, techMarker, customerMarker;
let isMapInit = false;

checkAuthState(true, null);
injectBottomNav('customer', 'tracking');

onAuthStateChanged(auth, (user) => {
    if (user) listenToRequest();
});

function initMap(customerLat, customerLng) {
    if (isMapInit) return;
    map = L.map('map', { zoomControl: false }).setView([customerLat, customerLng], 14);
    
    const tileUrl = document.documentElement.classList.contains('dark') 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
    L.tileLayer(tileUrl, { attribution: '© OpenStreetMap' }).addTo(map);

    const custIcon = L.divIcon({ html: '🏠', className: 'text-4xl drop-shadow-md', iconSize: [40, 40] });
    customerMarker = L.marker([customerLat, customerLng], { icon: custIcon }).addTo(map);
    
    isMapInit = true;
}

function listenToRequest() {
    const requestRef = doc(db, "requests", requestId);

    onSnapshot(requestRef, async (docSnap) => {
        if (!docSnap.exists()) return;
        const req = docSnap.data();

        if (!isMapInit) initMap(req.location.lat, req.location.lng);

        if (req.techLocation) {
            const techIcon = L.divIcon({ html: '🚙', className: 'text-4xl drop-shadow-xl', iconSize: [40, 40] });
            if (!techMarker) {
                techMarker = L.marker([req.techLocation.lat, req.techLocation.lng], { icon: techIcon }).addTo(map);
            } else {
                techMarker.setLatLng([req.techLocation.lat, req.techLocation.lng]);
            }
            
            const bounds = L.latLngBounds([ [req.location.lat, req.location.lng], [req.techLocation.lat, req.techLocation.lng] ]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        updateStatusUI(req.status);

        if (req.technicianId && document.getElementById('tech-details').innerHTML.includes('جاري')) {
            const techDoc = await getDoc(doc(db, "users", req.technicianId));
            if (techDoc.exists()) {
                const tech = techDoc.data();
                document.getElementById('tech-details').innerHTML = `
                    <div class="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-dark-border">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex justify-center items-center text-3xl">👷</div>
                            <div>
                                <h3 class="font-black text-gray-900 dark:text-white">${tech.name}</h3>
                                <div class="flex text-yellow-500 text-xs font-bold mt-1">⭐ ${(tech.rating || 5).toFixed(1)}</div>
                            </div>
                        </div>
                        <a href="tel:${tech.phone}" class="w-12 h-12 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition shadow-sm">📞</a>
                    </div>
                `;
            }
        }

        if (req.status === 'completed') {
            window.location.href = `checkout-rating.html?requestId=${requestId}`;
        }
    });
}

function updateStatusUI(status) {
    const steps = { 'on_the_way': 'step-onway', 'arrived': 'step-arrived', 'in_progress': 'step-working' };

    Object.keys(steps).forEach(s => {
        const stepEl = document.getElementById(steps[s]);
        if (status === s || isStatusPassed(status, s)) {
            stepEl.classList.remove('opacity-50', 'grayscale');
            stepEl.querySelector('div').classList.replace('bg-gray-300', 'bg-primary-600');
            stepEl.querySelector('div').classList.replace('dark:bg-slate-600', 'bg-primary-600');
            stepEl.querySelector('div').classList.add('text-white', 'shadow-md');
            stepEl.querySelector('span').classList.replace('text-gray-500', 'text-primary-800');
            stepEl.querySelector('span').classList.replace('dark:text-gray-400', 'dark:text-primary-300');
            stepEl.querySelector('span').classList.add('font-black');
        }
    });
}

function isStatusPassed(current, target) {
    const order = ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];
    return order.indexOf(current) > order.indexOf(target);
}