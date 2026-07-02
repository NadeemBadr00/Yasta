# 📝 سجل التحديثات الشامل — مشروع يسطا (Yasta Changelog)

> **آخر تحديث:** 2 يوليو 2026 — 10:37 PM
> **الموقع:** `C:\Users\DELL\Desktop\NBrain\Yasta`

---

## 📊 إحصائيات سريعة

| المقياس | القيمة |
|---|---|
| إجمالي الملفات المعدلة/المنشأة | **30+ ملف** |
| الميزات المنفذة | **8 ميزات** (5 Phase 1 ✅ + 3 Phase 2 ✅) |
| الأنظمة الأساسية | 3 (عميل + فني + أدمن) |
| قاعدة البيانات | Firebase Firestore (7+ collections) |

---

## ✅ Phase 1 — Quick Wins (تم ✅)
> **التاريخ:** 2 يوليو 2026 — 10:00 PM
> **المدة:** ~3 دقائق (4 agents بالتوازي)

### 1.1 🤖 تشخيص ذكي بالذكاء الاصطناعي (Gemini Vision)
**الحالة:** ✅ تم + تحديث لاحق

| الملف | الحالة | الوصف |
|---|---|---|
| js/gemini-diagnosis.js | 🆕 جديد | Gemini 3.5 Flash + 8 مفاتيح + Key Rotation |
| customer/request-service.html | ✏️ معدّل | زر AI + loading + نتائج |
| customer/js/request-service.js | ✏️ معدّل | استدعاء Gemini + حفظ التشخيص |

**التفاصيل التقنية:**
- موديل: `gemini-3.5-flash`
- 8 مفاتيح API مع تدوير تلقائي
- 3 محاولات مع fallback عند Rate Limit
- دعم صور (Vision) + نص (Text-only)
- `thinkingLevel: 'low'` للصور / `'minimal'` للنص

### 1.2 🎁 نظام الإحالة (Referral System) — ✅ تم

| الملف | الحالة |
|---|---|
| register.html | ✏️ حقل كود الإحالة |
| js/register.js | ✏️ توليد كود + مكافأة |
| customer/invite.html | 🆕 صفحة الدعوات |
| customer/dashboard.html | ✏️ زر FAB 🎁 |

### 1.3 🔐 قواعد حماية Firebase — ✅ تم

| الملف | الحالة |
|---|---|
| firestore.rules | 🆕 6 collections محمية |
| storage.rules | 🆕 10MB limit |
| firebase.json | 🆕 إعدادات CLI |
| .firebaserc | 🆕 ربط المشروع |

### 1.4 🛡️ ضمان 30 يوم — ✅ تم

| الملف | الحالة |
|---|---|
| customer/js/checkout-rating.js | ✏️ warrantyExpiresAt |
| customer/js/history.js | ✏️ شارات + زر ضمان |
| customer/history.html | ✏️ Tailwind config |

### 1.5 💰 رسم معاينة + حد أدنى — ✅ تم

| الملف | الحالة |
|---|---|
| customer/checkout-rating.html | ✏️ تفصيل الفاتورة |
| technician/js/active-job.js | ✏️ حد أدنى 50ج |
| technician/active-job.html | ✏️ min=50 |

---

## ✅ Phase 2 — Core Features (تم ✅)
> **التاريخ:** 2 يوليو 2026 — 10:41 PM
> **المدة:** ~5 دقائق (4 agents بالتوازي)

### 2.1 💬 محادثة مباشرة (In-App Chat) — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| js/chat.js | 🆕 جديد | موديول شات real-time + إرسال صور |
| customer/chat.html | 🆕 جديد | صفحة شات العميل (WhatsApp-style) |
| technician/chat.html | 🆕 جديد | صفحة شات الفني |
| customer/tracking.html | ✏️ معدّل | زر FAB 💬 أخضر |
| technician/active-job.html | ✏️ معدّل | زر FAB 💬 أخضر |

**التفاصيل:**
- Real-time عبر `onSnapshot` على subcollection `requests/{id}/messages`
- إرسال نصوص + صور (Firebase Storage: `chat/{requestId}/`)
- بابلز: رسائلي يمين (أزرق) / الطرف التاني شمال (أبيض)
- `calculateTimeAgo()` بالعربية (الآن، منذ 5 د، منذ 2 س...)
- Auto-scroll + Enter للإرسال + Shift+Enter لسطر جديد
- حد أقصى 5MB للصور + معاينة قبل الإرسال

### 2.2 📦 باقات أسعار ثابتة (Packages) — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| admin/packages.html | 🆕 جديد | صفحة إدارة الباقات (CRUD) |
| admin/js/packages.js | 🆕 جديد | منطق + Auto-seed 8 باقات |
| customer/request-service.html | ✏️ معدّل | toggle باقة/وصف + grid باقات |
| customer/js/request-service.js | ✏️ معدّل | تحميل + اختيار باقة + submit |
| admin/dashboard.html | ✏️ معدّل | رابط الباقات في Sidebar |
| admin/categories.html | ✏️ معدّل | رابط الباقات في Sidebar |
| admin/live-map.html | ✏️ معدّل | رابط الباقات في Sidebar |
| admin/verify-users.html | ✏️ معدّل | رابط الباقات في Sidebar |

**التفاصيل:**
- Collection جديد: `packages` (name, category, price, duration, description, icon, isActive)
- 8 باقات تلقائية عند أول تشغيل (تكييف، سباكة، كهرباء، نجارة، تنظيف)
- Toggle في صفحة الطلب: "وصف مفتوح" (افتراضي) / "باقة جاهزة 📦"
- اختيار الباقة → يخفي الوصف والصور والـ AI → يظهر grid الباقات
- الطلب يتخزن بـ `requestType: 'package'` + `packageName` + `packagePrice`

### 2.3 🏷️ نظام المناقصة (Bidding) — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| community.html | ✏️ معدّل | bid toggle + price/duration fields |
| js/community.js | ✏️ معدّل (300→466 سطر) | bid submit + render + accept flow |

**التفاصيل:**
- فنيين يقدموا عروض أسعار رسمية (سعر + مدة + وصف)
- بطاقة عرض مميزة: gradient أخضر + شارة سعر كبيرة
- زر "✅ قبول العرض" يظهر فقط لصاحب المنشور
- Accept → إنشاء طلب جديد بـ `status: 'accepted'` + GPS + `source: 'community_bid'`
- توجيه تلقائي لصفحة التتبع

---

### 2.4 🔍 تحليل النسخة المحدثة (Downloads) — ✅ تم

> **نتيجة:** النسخة في Downloads هي **UI prototype/demo** بتصميمات أجمل لكن بنية مكسورة

#### ❌ مشاكل نسخة Downloads:
- بنية Inline (مش modular) — كل JS داخل HTML
- حذف نظام الإحالة + التشخيص الذكي + صفحة الدعوات
- Brand متغير من "يسطا" لـ "صلحلي"
- بيانات Static/Mock بدل Firebase حقيقي

#### ✅ حاجات نقدر ناخدها (Cherry-Pick):
1. **🤖 Chatbot Sidebar** — واجهة شات AI على الديسكتوب (customer/dashboard)
2. **👥 Tech Selection Flow** — العميل يختار الفني من قائمة (finding-technician 3-state)
3. **📊 Enterprise Admin Dashboard** — تصميم أدمن احترافي (Chart.js + glass effects)
4. **🛠️ Enterprise Technician Dashboard** — sidebar + stats + chart
5. **🧭 Smart Bottom Nav** — `getPath()` helper + 8 tabs
6. **🔍 Verify Users UI** — tabs + search + image modal + premium cards
7. **🔐 Anonymous Auth** — fallback لـ signInAnonymously + demo mode
8. **📸 Image Upload Timeout** — 4 second race condition fix

---

## ✅ Phase 3 — Cherry-Pick UI Upgrades (تم ✅)
> **التاريخ:** 2 يوليو 2026 — 10:49 PM
> **المدة:** ~6 دقائق (4 agents بالتوازي)

### 3.1 👥 اختيار الفني بـ 3 مراحل (Finding-Technician) — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| customer/finding-technician.html | ✏️ أُعيد كتابته (45→182 سطر) | 3-state UI premium |
| customer/js/finding-technician.js | ✏️ أُعيد كتابته (53→340 سطر) | Firestore queries حقيقية |

**المراحل:**
1. **رادار** — 4 حلقات نبضية + أنيمشن cubic-bezier
2. **قائمة فنيين** — بطاقات بالاسم والتقييم والمسافة (GPS Haversine)
3. **تأكيد** — بطاقة نجاح + توجيه تلقائي للتتبع بعد 3 ثواني

### 3.2 📊 لوحة أدمن Enterprise — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| admin/dashboard.html | ✏️ أُعيد كتابته (123→260 سطر) | Enterprise design premium |
| admin/js/admin-dashboard.js | ✏️ أُعيد كتابته (90→290 سطر) | Chart.js + real queries |

**المميزات:**
- Sidebar احترافي + gradient logo + glass header (backdrop-blur)
- بطاقات إحصائية premium مع progress bars + hover translateY(-5px)
- Chart.js: توزيع الطلبات حسب التخصص (بيانات حقيقية)
- أفضل 5 فنيين (من Firestore: rating desc)
- آخر 10 عمليات (createdAt desc) + شارات حالة ملونة

### 3.3 🛠️ لوحة فني Enterprise (يسطا PRO) — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| technician/dashboard.html | ✏️ أُعيد كتابته | Enterprise + sidebar |
| technician/js/tech-dashboard.js | ✏️ محسّن | Stats + Chart.js + notifications |

**المميزات:**
- Sidebar بـ "يسطا PRO" branding + nav links
- 5 بطاقات إحصائية (اليوم، مكتمل، جاري، طوارئ، أرباح)
- Chart.js أسبوعي (آخر 7 أيام) + جدول آخر الطلبات
- جرس إشعارات مع عداد real-time + نبضة حمراء
- Toggle اونلاين/اوفلاين محفوظ ✅

### 3.4 🔍 صفحة توثيق المستخدمين Premium — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| admin/verify-users.html | ✏️ أُعيد كتابته | Premium UI + search + tabs |
| admin/js/verify-users.js | ✏️ أُعيد كتابته | Tab filters + image modal |

**المميزات:**
- بحث بالاسم/الإيميل/التليفون
- Tabs: المعلقة / الموثقة / المرفوضة
- 3 بطاقات إحصائية (عدد كل حالة)
- بطاقات premium: avatar gradient + national ID box + document preview
- Full-screen image modal للوثائق

### 3.5 🧭 Smart Bottom Nav — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| js/shared.js | ✏️ معدّل (injectBottomNav فقط) | getPath() + 8 tabs |

**التحسينات:**
- `getPath()` helper لحل مشاكل المسارات بين المجلدات
- 8 tabs بدل 4 (+ request, finding, tracking, checkout)
- عرض 800px + scrollable + whitespace-nowrap

### 3.6 🏠 صفحة رئيسية ذكية — ✅ تم

| الملف | الحالة |
|---|---|
| index.html | ✏️ معدّل — auth-aware header |

- مسجل دخول → "لوحة التحكم 🚀" / "لوحة الفني 🛠️" / "لوحة الإدارة 📊"
- مش مسجل → "تسجيل الدخول" (كما كان)

---

## 📦 Firestore Collections (نهائي)

| Collection | الحقول الجديدة |
|---|---|
| `users` | referralCode, walletBalance, referralCount, referredBy, firstOrderDiscount, fcmToken |
| `requests` | aiDiagnosis, warrantyExpiresAt, isWarranty, originalRequestId, requestType, packageName, packagePrice, source, paymentMethod, paymentReceiptUrl, paidFromWallet, paidAt |
| `packages` | 🆕 name, category, price, duration, description, icon, isActive |
| `requests/{id}/messages` | 🆕 senderId, senderName, senderRole, text, imageUrl |
| `notifications/{uid}/items` | 🆕 title, body, requestId, read, createdAt |
| `comments` | isBid, bidPrice, bidDuration |

---

## ✅ Phase 4 — Revenue & Intelligence (تم ✅)
> **التاريخ:** 2 يوليو 2026 — 11:00 PM
> **المدة:** ~4 دقائق (3 agents بالتوازي)

### 4.1 🔔 Push Notifications (FCM) — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| js/notifications.js | 🆕 جديد | FCM token + foreground listener |
| firebase-messaging-sw.js | 🆕 جديد | Service worker للإشعارات الخلفية |
| js/firebase-config.js | ✏️ معدّل | تصدير `app` object |
| customer/js/request-service.js | ✏️ معدّل | إرسال إشعارات للفنيين |
| technician/dashboard.html | ✏️ معدّل | بانر طلب إذن الإشعارات |
| customer/dashboard.html | ✏️ معدّل | بانر طلب إذن الإشعارات |

**التفاصيل:**
- Service Worker: إشعارات خلفية + click handler
- Foreground: Toast عربي RTL مع auto-dismiss
- إشعارات الطلبات: subcollection `notifications/{techId}/items`
- بانر أنيق لطلب الإذن (slide-up + gradient)
- ⚠️ يحتاج VAPID Key من Firebase Console

### 4.2 📸 OCR آلي للبطاقة الشخصية — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| js/gemini-ocr.js | 🆕 جديد | Gemini Vision OCR + fuzzy matching |
| admin/verify-users.html | ✏️ معدّل | زر AI + CSS أنيمشن |
| admin/js/verify-users.js | ✏️ معدّل | AI verification flow |

**التفاصيل:**
- `extractIdData()`: Gemini 3.5 Flash يقرأ الاسم + الرقم القومي + العنوان + الميلاد + الانتهاء
- `verifyIdMatch()`: مقارنة ذكية (Levenshtein + Arabic normalization: ة/ه, أ/إ/آ/ا, تشكيل)
- 3 مستويات ثقة: high (تلقائي ✅) / medium (تنبيه) / low (تحذير)
- زر AI بنفسجي + جدول نتائج glassmorphism

### 4.3 💳 بوابة دفع متعددة — ✅ تم

| الملف | الحالة | الوصف |
|---|---|---|
| customer/checkout-rating.html | ✏️ معدّل | 3 بطاقات دفع premium |
| customer/js/checkout-rating.js | ✏️ معدّل | payment logic + wallet deduct |
| technician/js/wallet.js | ✏️ معدّل | payment method badges |

**التفاصيل:**
- 💵 نقدي (افتراضي) — ادفع للفني مباشرة
- 📱 InstaPay — رقم تحويل + رفع إيصال → Firebase Storage
- 💰 رصيد المحفظة — خصم تلقائي `increment(-cost)`
- شارات ملونة في محفظة الفني (أخضر/أزرق/أصفر)

---

## 📈 الإحصائيات النهائية

| المقياس | القيمة |
|---|---|
| **إجمالي الميزات** | **17 ميزة** |
| **ملفات جديدة** | **19 ملف** |
| **ملفات معدّلة** | **30+ ملف** |
| **الإجمالي** | **49+ ملف** |
| **Phases مكتملة** | **4 من 4** ✅ |
| **وقت التنفيذ الكلي** | **~25 دقيقة** (15+ agents بالتوازي) |

| **Phases مكتملة** | 3 من 3 ✅ |
| **وقت التنفيذ** | ~15 دقيقة (12 agents بالتوازي) |
