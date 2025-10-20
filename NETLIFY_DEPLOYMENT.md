# 🚀 دليل النشر على Netlify - نظام إبراهيم للمحاسبة

## 📋 **المتطلبات قبل البدء**

### 1. إنشاء حساب على Netlify
- اذهب إلى: https://www.netlify.com
- سجل دخول أو أنشئ حساب جديد (مجاني)

### 2. إعداد قاعدة البيانات على Neon
- اذهب إلى: https://neon.tech
- أنشئ مشروع جديد
- احفظ الـ `DATABASE_URL`

---

## ⚡ **خطوات النشر السريع**

### الطريقة 1: النشر المباشر من Netlify Dashboard (الأسهل)

#### الخطوة 1: إنشاء Repository على GitHub

1. **اذهب إلى GitHub**:
   - https://github.com/new
   
2. **أنشئ Repository جديد**:
   - اسم الـ Repository: `ibrahim-accounting-system`
   - اجعله Public أو Private (حسب رغبتك)
   - اضغط "Create repository"

3. **ارفع المشروع على GitHub**:
   ```bash
   cd "C:\Users\SANND\Desktop\ibrahim-accounting-netlify"
   
   git init
   git add .
   git commit -m "Initial commit - Ibrahim Accounting System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ibrahim-accounting-system.git
   git push -u origin main
   ```

#### الخطوة 2: ربط GitHub مع Netlify

1. **اذهب إلى Netlify Dashboard**:
   - https://app.netlify.com

2. **اضغط "Add new site"**:
   - اختر "Import an existing project"

3. **اختر GitHub**:
   - امنح Netlify الصلاحيات
   - اختر الـ Repository: `ibrahim-accounting-system`

4. **إعدادات البناء**:
   - **Base directory**: `apps/web`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `apps/web/build/client`
   - اضغط "Deploy site"

#### الخطوة 3: إضافة متغيرات البيئة

1. **اذهب إلى Site settings > Environment variables**

2. **أضف المتغيرات التالية**:
   ```
   DATABASE_URL = postgresql://neondb_owner:npg_SRoDGZ42qWFp@ep-billowing-band-a-adhuxspr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

   AUTH_SECRET = your-random-secret-key-change-this
   
   NODE_ENV = production
   ```

3. **احفظ التغييرات**

4. **أعد النشر**:
   - اذهب إلى Deploys
   - اضغط "Trigger deploy"

---

### الطريقة 2: النشر باستخدام Netlify CLI

#### الخطوة 1: تثبيت Netlify CLI

```bash
npm install -g netlify-cli
```

#### الخطوة 2: تسجيل الدخول

```bash
netlify login
```

#### الخطوة 3: الانتقال للمشروع

```bash
cd "C:\Users\SANND\Desktop\ibrahim-accounting-netlify\apps\web"
```

#### الخطوة 4: تثبيت المكتبات

```bash
npm install
```

#### الخطوة 5: النشر

```bash
# نشر تجريبي
netlify deploy

# عندما يعمل بشكل صحيح، انشر للإنتاج
netlify deploy --prod
```

#### الخطوة 6: إضافة متغيرات البيئة

```bash
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set AUTH_SECRET "your-secret-key"
netlify env:set NODE_ENV "production"
```

---

## 🔧 **إعداد قاعدة البيانات**

### 1. تشغيل Schema على Neon

```bash
# إذا كان لديك psql مثبت
psql "DATABASE_URL" < database-schema.sql

# أو استخدم Neon Dashboard
# انسخ محتوى database-schema.sql
# الصقه في SQL Editor على Neon Dashboard
```

### 2. إنشاء متجر تجريبي

بعد تشغيل Schema، يمكنك إنشاء متجر تجريبي:

```sql
-- تم إنشاؤه تلقائياً في Schema
-- يمكنك تسجيل الدخول ب:
-- اسم المستخدم: admin
-- كلمة المرور: admin123 (يجب تغييرها)
```

---

## 🌐 **بعد النشر**

### 1. الحصول على الرابط

بعد النشر، ستحصل على رابط مثل:
```
https://your-site-name.netlify.app
```

### 2. ربط Domain مخصص (اختياري)

1. اذهب إلى Site settings > Domain management
2. اضغط "Add custom domain"
3. أدخل الدومين الخاص بك
4. اتبع التعليمات لتحديث DNS

---

## ✅ **اختبار الموقع**

### 1. افتح الموقع
```
https://your-site-name.netlify.app
```

### 2. سجل دخول بالحساب التجريبي
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

### 3. تأكد من عمل:
- ✅ تسجيل الدخول
- ✅ Dashboard
- ✅ إنشاء وارد/صادر
- ✅ المخزون
- ✅ التقارير

---

## 🔒 **الأمان - مهم جداً**

### 1. تغيير AUTH_SECRET

أنشئ مفتاح عشوائي قوي:

```bash
# في PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

ثم حدّث `AUTH_SECRET` على Netlify.

### 2. تغيير كلمة مرور admin

بعد أول تسجيل دخول، غيّر كلمة المرور من الإعدادات.

---

## 📊 **مراقبة الأداء**

### 1. Netlify Analytics
- اذهب إلى Site > Analytics
- راقب الزيارات والأداء

### 2. Function Logs
- اذهب إلى Site > Functions
- راقب استدعاءات API

---

## 🐛 **حل المشاكل الشائعة**

### المشكلة: خطأ في البناء (Build Error)

**الحل:**
```bash
# تأكد من تثبيت المكتبات محلياً أولاً
cd apps/web
npm install
npm run build

# إذا نجح محلياً، انشر مرة أخرى
```

### المشكلة: خطأ في الاتصال بقاعدة البيانات

**الحل:**
1. تأكد من صحة `DATABASE_URL`
2. تأكد من تشغيل `database-schema.sql`
3. تحقق من الـ Environment Variables على Netlify

### المشكلة: 404 على الصفحات

**الحل:**
تأكد من وجود ملف `netlify.toml` في جذر المشروع مع إعدادات الـ redirects.

---

## 🔄 **تحديث الموقع**

### إذا كنت تستخدم GitHub:
```bash
# أي تغييرات تدفعها لـ GitHub ستنشر تلقائياً
git add .
git commit -m "تحديث"
git push
```

### إذا كنت تستخدم CLI:
```bash
cd apps/web
netlify deploy --prod
```

---

## 💰 **التكاليف**

### Netlify (مجاني):
- ✅ 100GB bandwidth شهرياً
- ✅ 300 دقيقة Build شهرياً
- ✅ SSL مجاني
- ✅ CDN عالمي

### Neon (مجاني):
- ✅ 0.5GB تخزين
- ✅ 1 Project
- ✅ Branching

**كافي للبداية بدون تكاليف!**

---

## 📞 **الدعم**

إذا واجهت أي مشاكل:

- **البريد**: systemibrahem@gmail.com
- **واتساب**: +963 994 054 027
- **رابط واتساب**: https://wa.me/963994054027

---

## 🎉 **تهانينا!**

موقعك الآن live على الإنترنت! 🚀

**الرابط**: `https://your-site-name.netlify.app`

شارك الرابط مع عملائك وابدأ باستقبال المستخدمين!

---

## 📋 **قائمة التحقق النهائية**

- [ ] تم النشر على Netlify
- [ ] تم تشغيل database-schema.sql
- [ ] تم إضافة متغيرات البيئة
- [ ] تم تغيير AUTH_SECRET
- [ ] تم تغيير كلمة مرور admin
- [ ] تم اختبار تسجيل الدخول
- [ ] تم اختبار إنشاء فاتورة
- [ ] تم اختبار التقارير
- [ ] الموقع يعمل بشكل كامل ✅

---

**جاهز للانطلاق! 🎊**

© 2025 نظام إبراهيم للمحاسبة

