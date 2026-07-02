// js/chatbot.js
// مساعد يسطا الذكي — Gemini 2.5 Flash Chatbot Module
// يستخدم نفس مفاتيح API من gemini-diagnosis.js مع تدوير تلقائي

// ==========================================
// مفاتيح Gemini API (نفس المفاتيح بالظبط)
// ==========================================
const API_KEYS = [
    'YOUR_API_KEY',
    'YOUR_API_KEY',
    'YOUR_API_KEY',
    'YOUR_API_KEY',
    'YOUR_API_KEY',
    'YOUR_API_KEY',
    'YOUR_API_KEY',
    'YOUR_API_KEY'
];

let currentKeyIndex = Math.floor(Math.random() * API_KEYS.length);
const getNextKey = () => {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
};

// ==========================================
// الموديل والإعدادات
// ==========================================
const MODEL_ID = 'gemini-2.5-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

// ==========================================
// System Prompt — شخصية مساعد يسطا
// ==========================================
const SYSTEM_PROMPT = `أنت "مساعد يسطا" — مساعد ذكي متخصص في خدمات الصيانة المنزلية في مصر.
مهمتك:
1. تشخيص الأعطال المنزلية (سباكة، كهربا، نجارة، تكييف، دهانات، أجهزة) سواء من وصف نصي أو صورة
2. تقديم نصائح للإصلاح المؤقت (لحد ما يوصل الفني)
3. تقدير التكلفة التقريبية بالجنيه المصري
4. تحديد نوع الفني المطلوب (سباك، كهربائي، نجار، فني تكييف، إلخ)
5. اقتراح طلب فني من المنصة

قواعد:
- تكلم بالعامية المصرية بأسلوب ودي ومهني
- ردودك مختصرة وعملية
- لو فيه صورة، حللها بالتفصيل واشرح المشكلة
- استخدم الإيموجي بشكل معتدل
- في نهاية كل تشخيص، اقترح "اطلب فني من يسطا" مع نوع التخصص المطلوب
- لو السؤال مش عن صيانة، رد بلطف إنك متخصص في الصيانة المنزلية بس
- لو المستخدم بعتلك صورة بدون نص، اعتبره عايز تشخيص للمشكلة الظاهرة في الصورة`;

// ==========================================
// تاريخ المحادثة
// ==========================================
let conversationHistory = [];

// تحميل المحادثة من sessionStorage لو موجودة
function loadConversation() {
    try {
        const saved = sessionStorage.getItem('yasta-chat-history');
        if (saved) {
            conversationHistory = JSON.parse(saved);
        }
    } catch (e) {
        conversationHistory = [];
    }
}

// حفظ المحادثة في sessionStorage
function saveConversation() {
    try {
        // نحفظ بس النصوص (بدون الصور لأنها كبيرة)
        const toSave = conversationHistory.map(msg => ({
            role: msg.role,
            parts: msg.parts.filter(p => p.text).map(p => ({ text: p.text }))
        }));
        sessionStorage.setItem('yasta-chat-history', JSON.stringify(toSave));
    } catch (e) {
        // لو فشل الحفظ (مساحة ممتلئة) — نكمل عادي
        console.warn('Could not save chat to sessionStorage:', e);
    }
}

// تحميل المحادثة عند بدء التشغيل
loadConversation();

// ==========================================
// إرسال رسالة لـ Gemini
// ==========================================
export async function sendMessage(text, imageBase64 = null) {
    // بناء أجزاء رسالة المستخدم
    const userParts = [];

    if (text && text.trim()) {
        userParts.push({ text: text.trim() });
    }

    if (imageBase64) {
        // لو مفيش نص مع الصورة، نضيف نص افتراضي
        if (userParts.length === 0) {
            userParts.push({ text: 'حلل المشكلة في الصورة دي' });
        }
        userParts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
            }
        });
    }

    if (userParts.length === 0) {
        throw new Error('لازم تكتب رسالة أو ترفع صورة');
    }

    // إضافة رسالة المستخدم للتاريخ
    conversationHistory.push({
        role: 'user',
        parts: userParts
    });

    // بناء الطلب
    const requestBody = {
        system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: conversationHistory.map(msg => ({
            role: msg.role,
            parts: msg.parts
        })),
        generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7
        }
    };

    // محاولة مع تدوير المفاتيح (حتى 3 محاولات)
    let lastError = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const apiKey = getNextKey();

        try {
            const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Gemini Chat Error (key ${attempt + 1}):`, response.status, errorData);

                // لو Rate Limit أو Forbidden — جرب مفتاح آخر
                if (response.status === 429 || response.status === 403) {
                    lastError = new Error(`خطأ من الخادم: ${response.status}`);
                    continue;
                }

                // حذف رسالة المستخدم من التاريخ لو فشل
                conversationHistory.pop();
                throw new Error(`خطأ من الخادم: ${response.status}`);
            }

            const data = await response.json();

            // استخراج النص من الرد
            const responseText = data?.candidates?.[0]?.content?.parts
                ?.filter(part => part.text)
                ?.map(part => part.text)
                ?.join('\n');

            if (!responseText) {
                conversationHistory.pop();
                throw new Error('لم يتم الحصول على رد من المساعد');
            }

            // إضافة رد الـ AI للتاريخ
            conversationHistory.push({
                role: 'model',
                parts: [{ text: responseText }]
            });

            // حفظ المحادثة
            saveConversation();

            return responseText;

        } catch (error) {
            lastError = error;
            console.warn(`Chat attempt ${attempt + 1} failed:`, error.message);

            if (attempt < maxRetries - 1) continue;
        }
    }

    // كل المحاولات فشلت — حذف رسالة المستخدم
    conversationHistory.pop();

    console.error('Chat Error (all retries failed):', lastError);
    throw new Error('فشل الاتصال بمساعد يسطا. تأكد من اتصالك بالإنترنت وحاول تاني. 🔄');
}

// ==========================================
// مسح المحادثة
// ==========================================
export function clearChat() {
    conversationHistory = [];
    sessionStorage.removeItem('yasta-chat-history');
}

// ==========================================
// جلب تاريخ المحادثة (للعرض)
// ==========================================
export function getHistory() {
    return conversationHistory;
}

// ==========================================
// تنسيق رد الـ AI (Markdown-like → HTML)
// ==========================================
export function formatResponse(text) {
    if (!text) return '';

    let formatted = text;

    // Escape HTML first
    formatted = formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // **Bold** → <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // *Italic* → <em>
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Numbered lists: 1. item → <li>
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="chat-list-item numbered">$2</li>');

    // Bullet lists: - item or • item → <li>
    formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<li class="chat-list-item bullet">$1</li>');

    // Wrap consecutive <li> in <ul>
    formatted = formatted.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="chat-list">$1</ul>');

    // Line breaks → <br> (but not inside tags)
    formatted = formatted.replace(/\n/g, '<br>');

    // Clean up double <br> after </ul>
    formatted = formatted.replace(/<\/ul><br>/g, '</ul>');
    formatted = formatted.replace(/<br><ul/g, '<ul');

    // Detect technician type suggestions and add action button
    const techMapping = {
        'سباك': 'plumbing',
        'سباكة': 'plumbing',
        'كهربائي': 'electrical',
        'كهرباء': 'electrical',
        'كهربا': 'electrical',
        'نجار': 'carpentry',
        'نجارة': 'carpentry',
        'تكييف': 'ac',
        'فني تكييف': 'ac',
        'دهان': 'painting',
        'دهانات': 'painting',
        'نقاش': 'painting',
        'أجهزة': 'appliances',
        'فني أجهزة': 'appliances'
    };

    // Find if the response mentions requesting a technician
    const techRegex = /اطلب\s+(فني|سباك|كهربائي|نجار|فني تكييف|دهان|نقاش)/i;
    const techMatch = text.match(techRegex);

    let category = 'plumbing'; // default
    if (techMatch) {
        const techType = techMatch[1];
        category = techMapping[techType] || 'plumbing';
    } else {
        // Try to detect from full text
        for (const [keyword, cat] of Object.entries(techMapping)) {
            if (text.includes(keyword)) {
                category = cat;
                break;
            }
        }
    }

    // Always add the action button at the end of diagnosis messages
    const diagnosisKeywords = ['تشخيص', 'التكلفة', 'الإصلاح', 'فني', 'سباك', 'كهربائي', 'نجار', 'تكييف'];
    const hasDiagnosis = diagnosisKeywords.some(kw => text.includes(kw));

    if (hasDiagnosis) {
        formatted += `<a href="customer/request-service.html?category=${category}" class="chat-action-btn">🔧 اطلب فني للإصلاح</a>`;
    }

    return formatted;
}
