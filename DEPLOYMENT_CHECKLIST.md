# قائمة متطلبات النشر - نظام إبراهيم للمحاسبة

## ✅ المتطلبات الأساسية قبل النشر

### 1. قاعدة البيانات
- [ ] إنشاء ملف `schema.sql` مع جميع الجداول المطلوبة
- [ ] إنشاء حساب على Neon Database (https://neon.tech)
- [ ] تشغيل ملف Schema على قاعدة البيانات
- [ ] ضبط متغير البيئة `DATABASE_URL`

### 2. متغيرات البيئة المطلوبة

#### للويب (create-anything/apps/web/.env)
```env
DATABASE_URL="postgresql://user:password@host/database"
AUTH_SECRET="your-secret-key-here-change-this"
NODE_ENV="production"
```

#### للموبايل (create-anything/apps/mobile/.env)
```env
API_URL="https://your-domain.com"
```

### 3. إكمال الصفحات الناقصة

#### صفحات الويب المطلوبة:
- [ ] `/inventory` - إدارة المخزون
- [ ] `/reports` - التقارير
- [ ] `/settings` - الإعدادات
- [ ] `/partners` - إدارة الشركاء
- [ ] `/invoices-in` - عرض صفحة الواردات
- [ ] `/invoices-out` - عرض صفحة الصادرات
- [ ] `/employees` - عرض صفحة الموظفين

#### API Routes المطلوبة:
- [ ] `/api/inventory` (GET, POST, PUT, DELETE)
- [ ] `/api/invoices-in/:id` (PUT, DELETE)
- [ ] `/api/invoices-out/:id` (PUT, DELETE)
- [ ] `/api/employees/:id` (PUT, DELETE)
- [ ] `/api/partners/:id` (PUT, DELETE)
- [ ] `/api/reports` (GET)

### 4. الأمان والحماية
- [ ] تغيير `AUTH_SECRET` إلى قيمة عشوائية قوية
- [ ] تفعيل HTTPS
- [ ] ضبط CORS للسماح فقط للنطاقات المصرح بها
- [ ] تفعيل Rate Limiting
- [ ] إضافة Helmet.js للحماية

### 5. نشر الويب

#### الخيار 1: Vercel (موصى به)
```bash
cd create-anything/apps/web
npm install -g vercel
vercel
```

#### الخيار 2: Netlify
```bash
npm run build
# ثم ارفع مجلد build على Netlify
```

#### ضبط متغيرات البيئة على المنصة:
- DATABASE_URL
- AUTH_SECRET
- NODE_ENV=production

### 6. نشر الموبايل

#### لـ Android:
```bash
cd create-anything/apps/mobile
eas build --platform android
```

#### لـ iOS:
```bash
eas build --platform ios
```

#### بديل (Expo Go):
```bash
npx expo start --tunnel
```

### 7. الاختبارات المطلوبة قبل النشر
- [ ] تسجيل الدخول يعمل
- [ ] Dashboard يعرض البيانات
- [ ] إنشاء وارد جديد يعمل
- [ ] إنشاء صادر جديد يعمل
- [ ] إنشاء موظف جديد يعمل
- [ ] الصلاحيات تعمل بشكل صحيح
- [ ] التنبيهات تظهر
- [ ] الوضع الليلي يعمل
- [ ] العملات المتعددة تعمل

### 8. النسخ الاحتياطي
- [ ] ضبط نسخ احتياطي تلقائي للقاعدة
- [ ] حفظ نسخة من الكود على GitHub

### 9. المراقبة والصيانة
- [ ] إضافة Google Analytics أو Mixpanel
- [ ] إضافة Sentry لتتبع الأخطاء
- [ ] ضبط إشعارات للأخطاء الحرجة

### 10. الدعم والتواصل
- [ ] التأكد من أرقام الواتساب تعمل
- [ ] التأكد من البريد الإلكتروني يعمل
- [ ] إضافة صفحة FAQ

---

## 📞 معلومات الاتصال للدعم
- واتساب: +963 994 054 027
- البريد: systemibrahem@gmail.com

## 💰 خطط الاشتراك
- شهري: 5$
- 6 أشهر: 30$
- سنوي: 40$

