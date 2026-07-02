// admin/js/live-map.js
import { auth, db } from '../../js/firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { checkAuthState } from '../../js/shared.js';

checkAuthState(true, null);

document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '../login.html');
});

const map = L.map('admin-map', { zoomControl: false }).setView([30.0444, 31.2357], 11);

// ضبط لون الخريطة بناءً على الثيم
const tileUrl = document.documentElement.classList.contains('dark') 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

L.tileLayer(tileUrl, { attribution: '© OpenStreetMap & CARTO' }).addTo(map);

let activeMarkers = [];
let activeLines = [];

const q = query(
    collection(db, "requests"), 
    where("status", "in", ["searching", "accepted", "on_the_way", "arrived", "in_progress"])
);

onSnapshot(q, (snapshot) => {
    activeMarkers.forEach(m => map.removeLayer(m));
    activeLines.forEach(l => map.removeLayer(l));
    activeMarkers = []; activeLines = [];

    snapshot.forEach(doc => {
        const req = doc.data();
        
        if (req.location) {
            const custIcon = L.divIcon({ html: '🟢', className: 'text-xl drop-shadow-sm', iconSize: [20, 20] });
            const cMarker = L.marker([req.location.lat, req.location.lng], {icon: custIcon})
                .addTo(map).bindPopup(`<div class="font-cairo text-right" dir="rtl"><b class="text-primary-600">طالب خدمة:</b> ${req.category}<br>الحالة: <b>${req.status}</b></div>`);
            activeMarkers.push(cMarker);
        }

        if (req.techLocation) {
            const techIcon = L.divIcon({ html: '🚙', className: 'text-2xl drop-shadow-lg', iconSize: [25, 25] });
            const tMarker = L.marker([req.techLocation.lat, req.techLocation.lng], {icon: techIcon})
                .addTo(map).bindPopup(`<div class="font-cairo text-right" dir="rtl"><b>فني متوجه للعميل</b></div>`);
            activeMarkers.push(tMarker);

            if (req.location) {
                const isDark = document.documentElement.classList.contains('dark');
                const lineColor = isDark ? '#60a5fa' : '#3b82f6';
                const line = L.polyline([
                    [req.location.lat, req.location.lng], 
                    [req.techLocation.lat, req.techLocation.lng]
                ], {color: lineColor, weight: 3, dashArray: '6, 6', opacity: 0.7}).addTo(map);
                activeLines.push(line);
            }
        }
    });
});