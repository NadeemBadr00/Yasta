// js/gemini-diagnosis.js
// AI Diagnosis Module - Gemini 3.5 Flash Vision API Integration
// يستخدم أحدث موديل Gemini 3.5 Flash مع تدوير المفاتيح تلقائياً

// ==========================================
// مفاتيح Gemini API (مع تدوير تلقائي للتوزيع)
// ==========================================
const GEMINI_API_KEYS = [
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE',
    'YOUR_GEMINI_API_KEY_HERE'
];

// عداد لتدوير المفاتيح بالتساوي
let currentKeyIndex = Math.floor(Math.random() * GEMINI_API_KEYS.length);

function getNextApiKey() {
    const key = GEMINI_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    return key;
}

// Gemini 3.5 Flash — أحدث وأذكى موديل Flash
const MODEL_ID = 'gemini-3.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

/**
 * تحليل صورة عطل منزلي باستخدام Gemini 3.5 Flash Vision
 * @param {string} imageBase64 - بيانات الصورة بصيغة Base64 (بدون البادئة data:image/...)
 * @param {string} categoryName - اسم التخصص (مثال: سباكة، كهرباء)
 * @returns {Promise<string>} - نص التشخيص بالعربية
 */
export async function analyzeIssueImage(imageBase64, categoryName) {
    const prompt = `أنت خبير صيانة منزلية محترف في مصر. حلل صورة العطل التالية في تخصص "${categoryName}".

أجب بالعربية المصرية البسيطة بالتنسيق التالي:

🔍 **التشخيص المبدئي:**
[اشرح المشكلة في 2-3 سطور]

💰 **التكلفة التقريبية:**
[الحد الأدنى - الحد الأقصى بالجنيه المصري]

🔧 **الأدوات والقطع المطلوبة:**
[قائمة بالأدوات وقطع الغيار]

⏱️ **الوقت المتوقع:**
[المدة التقريبية للإصلاح]

⚠️ **نصيحة:**
[نصيحة مهمة للعميل]

كن مختصراً ومفيداً وواقعياً في تقدير الأسعار بالسوق المصري.`;

    // محاولة مع تدوير المفاتيح (حتى 3 محاولات)
    let lastError = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const apiKey = getNextApiKey();
        
        try {
            const response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    // Gemini 3.x: لا نستخدم temperature/top_p/top_k (غير موصى بها)
                    // نستخدم thinking_level بدلاً من thinking_budget
                    generationConfig: {
                        maxOutputTokens: 2048,
                        thinking: {
                            thinkingLevel: 'low'  // سريع وكافي لتشخيص الصور
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Gemini API Error (key ${attempt + 1}):`, response.status, errorData);
                
                // إذا كان الخطأ 429 (Rate Limit) أو 403 — جرب مفتاح آخر
                if (response.status === 429 || response.status === 403) {
                    lastError = new Error(`خطأ من الخادم: ${response.status}`);
                    continue; // جرب المفتاح التالي
                }
                
                throw new Error(`خطأ من الخادم: ${response.status}`);
            }

            const data = await response.json();

            // استخراج النص من رد Gemini
            const text = data?.candidates?.[0]?.content?.parts
                ?.filter(part => part.text)
                ?.map(part => part.text)
                ?.join('\n');

            if (!text) {
                throw new Error('لم يتم الحصول على نتيجة من التحليل');
            }

            return text;

        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1} failed:`, error.message);
            
            // إذا كان خطأ شبكة أو rate limit — جرب مفتاح آخر
            if (attempt < maxRetries - 1) continue;
        }
    }

    // كل المحاولات فشلت
    console.error('AI Diagnosis Error (all retries failed):', lastError);
    
    if (lastError?.message?.includes('خطأ من الخادم') || lastError?.message?.includes('لم يتم')) {
        throw lastError;
    }

    throw new Error('فشل الاتصال بخدمة الذكاء الاصطناعي. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
}

/**
 * تحليل نصي فقط (بدون صورة) — للحالات اللي العميل مش عنده صورة
 * @param {string} description - وصف المشكلة
 * @param {string} categoryName - اسم التخصص
 * @returns {Promise<string>} - نص التشخيص
 */
export async function analyzeIssueText(description, categoryName) {
    const prompt = `أنت خبير صيانة منزلية محترف في مصر. العميل عنده مشكلة في تخصص "${categoryName}" ووصفها كالتالي:
"${description}"

أجب بالعربية المصرية البسيطة بالتنسيق التالي:

🔍 **التشخيص المبدئي:**
[اشرح الأسباب المحتملة في 2-3 سطور]

💰 **التكلفة التقريبية:**
[الحد الأدنى - الحد الأقصى بالجنيه المصري]

🔧 **الأدوات والقطع المطلوبة:**
[قائمة بالأدوات وقطع الغيار المحتملة]

⏱️ **الوقت المتوقع:**
[المدة التقريبية للإصلاح]

كن مختصراً ومفيداً وواقعياً في تقدير الأسعار بالسوق المصري.`;

    const apiKey = getNextApiKey();

    try {
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    maxOutputTokens: 1024,
                    thinking: {
                        thinkingLevel: 'minimal'  // أسرع — تحليل نصي بسيط
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`خطأ من الخادم: ${response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts
            ?.filter(part => part.text)
            ?.map(part => part.text)
            ?.join('\n');

        if (!text) throw new Error('لم يتم الحصول على نتيجة');
        return text;

    } catch (error) {
        console.error('AI Text Analysis Error:', error);
        throw new Error('فشل التحليل النصي. حاول مرة أخرى.');
    }
}
