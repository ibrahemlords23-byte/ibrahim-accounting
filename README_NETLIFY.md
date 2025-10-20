# 🚀 نظام إبراهيم للمحاسبة - جاهز للنشر على Netlify

## 📦 **محتويات المجلد**

هذا مجلد نظيف جاهز للنشر مباشرة على Netlify يحتوي على:

```
ibrahim-accounting-netlify/
├── apps/
│   ├── web/                    ← تطبيق الويب كامل
│   └── mobile/                 ← تطبيق الموبايل
├── database-schema.sql         ← Schema قاعدة البيانات
├── netlify.toml               ← إعدادات Netlify
├── package.json               ← إعدادات المشروع
├── .gitignore                 ← ملفات Git
├── README.md                  ← دليل المشروع الكامل
├── DEPLOYMENT_GUIDE.md        ← دليل النشر العام
├── NETLIFY_DEPLOYMENT.md      ← دليل النشر على Netlify (اقرأ هذا!)
└── PROJECT_COMPLETE.md        ← ملخص المشروع

```

---

## ⚡ **البداية السريعة**

### 1️⃣ اقرأ دليل النشر
```
افتح ملف: NETLIFY_DEPLOYMENT.md
```

### 2️⃣ ارفع على GitHub
```bash
cd ibrahim-accounting-netlify
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

### 3️⃣ اربط مع Netlify
1. اذهب إلى: https://app.netlify.com
2. اضغط "New site from Git"
3. اختر الـ Repository
4. إعدادات البناء موجودة في `netlify.toml` تلقائياً
5. أضف متغيرات البيئة
6. اضغط Deploy!

---

## 🔑 **متغيرات البيئة المطلوبة**

أضف هذه على Netlify Dashboard:

```env
DATABASE_URL=postgresql://neondb_owner:npg_SRoDGZ42qWFp@ep-billowing-band-a-adhuxspr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

AUTH_SECRET=your-random-secret-key-change-this

NODE_ENV=production
```

**⚠️ مهم**: غيّر `AUTH_SECRET` لقيمة عشوائية قوية!

---

## 💾 **قاعدة البيانات**

### تشغيل Schema:
```bash
psql "DATABASE_URL" < database-schema.sql
```

أو استخدم Neon Dashboard وانسخ محتوى `database-schema.sql`

---

## 📊 **ما يحتويه هذا المجلد**

### ✅ Backend API (كامل)
- 11 API endpoint
- نظام مصادقة JWT
- 6 أدوار وصلاحيات
- حماية كاملة

### ✅ Frontend Pages (كامل)
- 10 صفحات
- تصميم حديث وجميل
- Responsive
- RTL Support

### ✅ Database Schema (كامل)
- 16 جدول
- Triggers تلقائية
- Row Level Security
- Indexes محسنة

### ✅ Mobile App (كامل)
- React Native + Expo
- جاهز للبناء

### ✅ Documentation (كامل)
- أدلة نشر مفصلة
- توثيق API
- دليل استخدام

---

## 🎯 **الميزات**

✅ **نظام متاجر متعدد** (Multi-tenant)  
✅ **دعم 3 عملات**: USD, TRY, SYP  
✅ **6 أدوار**: Owner, Manager, Accountant, Data Entry, Warehouse, Viewer  
✅ **نظام اشتراكات**: تجربة 30 يوم + خطط مدفوعة  
✅ **إدارة كاملة**: واردات, صادرات, مخزون, موظفين, رواتب  
✅ **6 أنواع تقارير**: حركة يومية, أرباح وخسائر, ذمم, مخزون, رواتب  
✅ **تنبيهات ذكية**: مخزون منخفض, فواتير متأخرة  
✅ **Audit Logs**: تسجيل جميع العمليات  

---

## 🔒 **الأمان**

- ✅ Argon2 لتشفير كلمات المرور
- ✅ JWT + Refresh Tokens
- ✅ Row Level Security
- ✅ حماية من SQL Injection
- ✅ CORS محدود
- ✅ صلاحيات دقيقة

---

## 📞 **الدعم**

- **البريد**: systemibrahem@gmail.com
- **هاتف/واتساب**: +963 994 054 027
- **رابط واتساب**: https://wa.me/963994054027

---

## 💰 **خطط الاشتراك**

| المدة | السعر |
|-------|------|
| شهري | 5$ |
| 6 أشهر | 30$ |
| سنوي | 40$ |

**تجربة مجانية**: 30 يوم

---

## 📖 **الملفات المهمة**

| الملف | الوصف |
|-------|-------|
| `NETLIFY_DEPLOYMENT.md` | **اقرأ هذا أولاً!** دليل النشر على Netlify |
| `netlify.toml` | إعدادات Netlify (جاهز) |
| `database-schema.sql` | Schema قاعدة البيانات |
| `README.md` | دليل المشروع الكامل |
| `apps/web/` | تطبيق الويب |

---

## 🎉 **جاهز للنشر!**

هذا المجلد نظيف ومنظم وجاهز للنشر مباشرة.

**الخطوات:**
1. اقرأ `NETLIFY_DEPLOYMENT.md`
2. ارفع على GitHub
3. اربط مع Netlify
4. أضف متغيرات البيئة
5. شغّل قاعدة البيانات
6. استمتع! 🚀

---

## ✨ **النتيجة النهائية**

بعد النشر، ستحصل على:
- ✅ موقع ويب live على الإنترنت
- ✅ SSL مجاني (HTTPS)
- ✅ CDN عالمي سريع
- ✅ نشر تلقائي من GitHub
- ✅ نظام محاسبة احترافي كامل

**تكلفة الاستضافة**: $0 (Netlify + Neon مجاناً!)

---

**بالتوفيق! 🌟**

© 2025 نظام إبراهيم للمحاسبة

