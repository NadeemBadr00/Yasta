// js/gemini-ocr.js
// OCR Module — قراءة البطاقة الشخصية بالذكاء الاصطناعي (Gemini 3.5 Flash Vision)
// يدعم تدوير المفاتيح تلقائياً مع إعادة المحاولة

// ==========================================
// مفاتيح Gemini API (نفس المفاتيح المستخدمة في gemini-diagnosis.js)
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

// Gemini 3.5 Flash
const MODEL_ID = 'gemini-3.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

// ==========================================
// OCR Prompt — متخصص في البطاقات الشخصية المصرية
// ==========================================
const OCR_PROMPT = 'أنت نظام OCR متخصص في قراءة البطاقات الشخصية المصرية. استخرج البيانات التالية من صورة البطاقة بصيغة JSON: {"name": "الاسم الكامل", "nationalId": "الرقم القومي 14 رقم", "address": "العنوان", "birthDate": "تاريخ الميلاد", "gender": "ذكر/أنثى", "expiryDate": "تاريخ الانتهاء"}. إذا لم تتمكن من قراءة حقل، اكتب "غير واضح". أجب بـ JSON فقط بدون أي نص إضافي.';

/**
 * استخراج بيانات البطاقة الشخصية من صورة باستخدام Gemini 3.5 Flash Vision
 * @param {string} imageBase64 - بيانات الصورة بصيغة Base64 (بدون البادئة data:image/...)
 * @returns {Promise<Object>} - البيانات المستخرجة كـ JSON object
 */
export async function extractIdData(imageBase64) {
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
                            { text: OCR_PROMPT },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        maxOutputTokens: 1024,
                        thinking: {
                            thinkingLevel: 'low'
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Gemini OCR Error (key ${attempt + 1}):`, response.status, errorData);

                // إذا كان الخطأ 429 (Rate Limit) أو 403 — جرب مفتاح آخر
                if (response.status === 429 || response.status === 403) {
                    lastError = new Error(`خطأ من الخادم: ${response.status}`);
                    continue;
                }

                throw new Error(`خطأ من الخادم: ${response.status}`);
            }

            const data = await response.json();

            // استخراج النص من رد Gemini (تصفية أجزاء التفكير)
            const text = data?.candidates?.[0]?.content?.parts
                ?.filter(part => part.text)
                ?.map(part => part.text)
                ?.join('\n');

            if (!text) {
                throw new Error('لم يتم الحصول على نتيجة من قراءة البطاقة');
            }

            // تنظيف الرد — إزالة أي markdown أو backticks
            const cleanedText = text
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // محاولة تحليل JSON
            try {
                const parsed = JSON.parse(cleanedText);
                return parsed;
            } catch (parseErr) {
                // محاولة استخراج JSON من وسط النص
                const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('فشل في تحليل رد الذكاء الاصطناعي كـ JSON');
            }

        } catch (error) {
            lastError = error;
            console.warn(`OCR Attempt ${attempt + 1} failed:`, error.message);

            if (attempt < maxRetries - 1) continue;
        }
    }

    // كل المحاولات فشلت
    console.error('OCR Error (all retries failed):', lastError);

    if (lastError?.message?.includes('خطأ من الخادم') || lastError?.message?.includes('لم يتم') || lastError?.message?.includes('فشل')) {
        throw lastError;
    }

    throw new Error('فشل الاتصال بخدمة قراءة البطاقة. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
}

// ==========================================
// مطابقة الأسماء العربية (Fuzzy Match)
// ==========================================

/**
 * تنظيف النص العربي — إزالة التشكيل والأحرف الخاصة والمسافات الزائدة
 */
function normalizeArabicText(text) {
    if (!text) return '';
    return text
        // إزالة التشكيل
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '')
        // توحيد الأحرف المتشابهة
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        // إزالة المسافات الزائدة
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * حساب نسبة تشابه بين نصين (Levenshtein-based similarity)
 */
function similarity(str1, str2) {
    const s1 = normalizeArabicText(str1);
    const s2 = normalizeArabicText(str2);

    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0;

    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1.0;

    // Levenshtein distance
    const matrix = Array.from({ length: len1 + 1 }, (_, i) =>
        Array.from({ length: len2 + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,       // deletion
                matrix[i][j - 1] + 1,       // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const distance = matrix[len1][len2];
    return 1 - distance / maxLen;
}

/**
 * التحقق من تطابق بيانات البطاقة مع بيانات المستخدم المسجلة
 * @param {Object} extractedData - البيانات المستخرجة من البطاقة
 * @param {Object} userData - بيانات المستخدم من قاعدة البيانات
 * @returns {{isMatch: boolean, confidence: 'high'|'medium'|'low', details: string}}
 */
export function verifyIdMatch(extractedData, userData) {
    const checks = [];
    let score = 0;
    let maxScore = 0;

    // ==========================================
    // 1. مقارنة الاسم (وزن عالي)
    // ==========================================
    if (extractedData.name && extractedData.name !== 'غير واضح') {
        maxScore += 50;
        const nameSim = similarity(extractedData.name, userData.name || '');

        if (nameSim >= 0.85) {
            score += 50;
            checks.push(`✅ الاسم متطابق (${Math.round(nameSim * 100)}%)`);
        } else if (nameSim >= 0.6) {
            score += 25;
            checks.push(`⚠️ الاسم متشابه جزئياً (${Math.round(nameSim * 100)}%) — "${extractedData.name}" ↔ "${userData.name}"`);
        } else {
            checks.push(`❌ الاسم مختلف — البطاقة: "${extractedData.name}" | المسجل: "${userData.name}"`);
        }
    } else {
        checks.push('⚠️ لم يتم قراءة الاسم من البطاقة');
    }

    // ==========================================
    // 2. مقارنة الرقم القومي (وزن عالي)
    // ==========================================
    if (extractedData.nationalId && extractedData.nationalId !== 'غير واضح') {
        maxScore += 50;
        const extractedId = extractedData.nationalId.replace(/\D/g, ''); // أرقام فقط
        const registeredId = (userData.nationalId || '').replace(/\D/g, '');

        // التحقق من صحة الصيغة (14 رقم)
        const isValidFormat = /^\d{14}$/.test(extractedId);

        if (!isValidFormat) {
            checks.push(`⚠️ الرقم القومي المستخرج ليس 14 رقم: "${extractedId}"`);
        } else if (extractedId === registeredId) {
            score += 50;
            checks.push('✅ الرقم القومي متطابق تماماً');
        } else {
            checks.push(`❌ الرقم القومي مختلف — البطاقة: "${extractedId}" | المسجل: "${registeredId}"`);
        }
    } else {
        checks.push('⚠️ لم يتم قراءة الرقم القومي من البطاقة');
    }

    // ==========================================
    // تحديد مستوى الثقة
    // ==========================================
    let confidence, isMatch;

    if (maxScore === 0) {
        confidence = 'low';
        isMatch = false;
    } else {
        const ratio = score / maxScore;
        if (ratio >= 0.9) {
            confidence = 'high';
            isMatch = true;
        } else if (ratio >= 0.5) {
            confidence = 'medium';
            isMatch = false;
        } else {
            confidence = 'low';
            isMatch = false;
        }
    }

    return {
        isMatch,
        confidence,
        details: checks.join('\n')
    };
}
