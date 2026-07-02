import os
import sys

# مسار المجلد الذي سيتم فحصه (يمكنك تغييره لمسار مجلدك مباشرة هنا)
TARGET_DIR = '.'

# المجلدات التي سيتم استثناؤها من البحث
EXCLUDE_DIRS = {
    '.git', '.firebase', 'node_modules', '__pycache__', 
    'venv', 'env', '.idea', '.vscode', 'dist', 'build', '.next'
}

# امتدادات الملفات التي سيتم استثناؤها (الملفات الثنائية، الصور، إلخ)
EXCLUDE_EXTS = {
    '.pyc', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', 
    '.zip', '.tar', '.gz', '.mp4', '.mp3', '.exe', '.dll', '.svg', '.ttf', '.woff'
}

# اسم الملف الذي سيتم حفظ النتيجة فيه
OUTPUT_FILE = 'project_code_summary.txt'

# اسم هذا السكربت لتجنب تضمين الكود الخاص به في النتيجة
SCRIPT_NAME = os.path.basename(__file__)

def generate_project_summary(target_dir=TARGET_DIR):
    """
    تقوم هذه الدالة بالمرور على جميع ملفات المشروع في المسار المحدد ودمج محتواها في ملف نصي واحد.
    """
    print(f"جاري جمع الملفات من المجلد: '{target_dir}'... يرجى الانتظار.")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        # المرور على جميع المجلدات والملفات انطلاقاً من المسار المحدد
        for root, dirs, files in os.walk(target_dir):
            
            # تعديل قائمة المجلدات (dirs) لاستبعاد المجلدات غير المرغوب فيها
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                # استبعاد ملف النتيجة والسكربت نفسه
                if file == OUTPUT_FILE or file == SCRIPT_NAME:
                    continue
                
                # استبعاد الملفات بناءً على الامتداد
                _, ext = os.path.splitext(file)
                if ext.lower() in EXCLUDE_EXTS:
                    continue
                
                # إنشاء المسار الكامل للملف
                file_path = os.path.join(root, file)
                
                # كتابة فاصل ومسار الملف في الملف النصي
                outfile.write("=" * 80 + "\n")
                outfile.write(f"المسار: {file_path}\n")
                outfile.write("=" * 80 + "\n\n")
                
                # محاولة قراءة محتوى الملف وكتابته
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        outfile.write(content)
                        outfile.write("\n\n")
                except UnicodeDecodeError:
                    # في حال كان الملف ثنائي أو لا يمكن قراءته كنص
                    outfile.write("[تعذر قراءة محتوى هذا الملف (قد يكون ملفاً ثنائياً أو بترميز غير مدعوم)]\n\n")
                except Exception as e:
                    # التقاط أي أخطاء أخرى
                    outfile.write(f"[حدث خطأ أثناء قراءة الملف: {str(e)}]\n\n")

    print(f"تم الانتهاء بنجاح! يمكنك العثور على النتيجة في الملف: {OUTPUT_FILE}")

if __name__ == "__main__":
    # التحقق مما إذا كان المستخدم قد مرر المسار كمعامل في سطر الأوامر
    if len(sys.argv) > 1:
        target_directory = sys.argv[1]
    else:
        # الاعتماد على المتغير الموجود في بداية الكود
        target_directory = TARGET_DIR
        
    # التحقق من أن المسار المدخل موجود بالفعل وهو مجلد
    if os.path.isdir(target_directory):
        generate_project_summary(target_directory)
    else:
        print(f"عذراً، المسار المدخل '{target_directory}' غير صحيح أو غير موجود.")