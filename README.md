# نظام إبراهيم للمحاسبة

نظام محاسبة شامل متعدد المتاجر مع دعم للعملات المتعددة وإدارة المخزون والرواتب والتقارير.

## 📋 **المحتويات**

- [نظرة عامة](#نظرة-عامة)
- [الميزات](#الميزات)
- [البنية التقنية](#البنية-التقنية)
- [التثبيت والإعداد](#التثبيت-والإعداد)
- [قاعدة البيانات](#قاعدة-البيانات)
- [واجهات API](#واجهات-api)
- [الأمان](#الأمان)
- [النشر](#النشر)
- [الدعم](#الدعم)

---

## 🌟 **نظرة عامة**

نظام إبراهيم للمحاسبة هو حل متكامل لإدارة الحسابات والمخزون والموظفين مصمم خصيصاً للشركات الصغيرة والمتوسطة. يدعم النظام:

- **نظام متاجر متعدد** (Multi-tenant): كل متجر بياناته منفصلة ومعزولة
- **عملات متعددة**: دولار أمريكي، ليرة تركية، ليرة سورية
- **إدارة الصلاحيات**: نظام صلاحيات دقيق لكل مستخدم
- **نظام اشتراكات**: تجربة مجانية 30 يوم + خطط شهرية/نصف سنوية/سنوية

---

## ✨ **الميزات**

### 1. لوحة التحكم
- ✅ إحصائيات فورية للواردات والصادرات
- ✅ عرض الأرصدة حسب العملة
- ✅ تنبيهات ذكية (مخزون منخفض، فواتير متأخرة، انتهاء اشتراكات)
- ✅ مخططات تفاعلية للحركة المالية

### 2. الواردات والصادرات
- ✅ إدارة كاملة للفواتير (إنشاء، تعديل، حذف)
- ✅ دعم العملات المتعددة
- ✅ تتبع حالات الدفع (مدفوع، جزئي، غير مدفوع)
- ✅ مرفقات الفواتير
- ✅ فلترة وبحث متقدم

### 3. المخزون
- ✅ إدارة الأصناف (كود، اسم، وحدة، أسعار)
- ✅ تتبع حركات المخزون (إدخال/إخراج)
- ✅ تنبيهات تلقائية عند انخفاض المخزون
- ✅ ربط الحركات بالفواتير

### 4. الموظفين والرواتب
- ✅ إدارة بيانات الموظفين
- ✅ تتبع السلف والغيابات والخصومات والمكافآت
- ✅ توليد كشوف رواتب تلقائية
- ✅ نظام اعتماد للرواتب
- ✅ كشف راتب شهري لكل موظف

### 5. الشركاء (عملاء وموردين)
- ✅ قاعدة بيانات موحدة للعملاء والموردين
- ✅ كشوف حساب مفصلة
- ✅ تتبع الذمم المدينة والدائنة

### 6. التقارير
- ✅ تقرير الحركة اليومية/الشهرية
- ✅ تقرير الأرباح والخسائر
- ✅ تقرير الذمم المدينة والدائنة
- ✅ تقرير حالة المخزون
- ✅ تقرير كشف الرواتب
- ✅ كشف حساب الشركاء
- ✅ تصدير PDF/Excel

### 7. الأمان والصلاحيات
- ✅ تشفير كلمات المرور (Argon2)
- ✅ JWT + Refresh Tokens
- ✅ نظام أدوار متعدد (مدير، محاسب، مدخل بيانات، مراقب مستودع، مشاهد)
- ✅ صلاحيات دقيقة لكل عملية
- ✅ Audit Logs لتسجيل جميع الأنشطة
- ✅ Row Level Security (RLS)

### 8. نظام الاشتراكات
- ✅ تجربة مجانية 30 يوم
- ✅ خطط اشتراك مرنة:
  - شهري: 5$
  - 6 أشهر: 30$
  - سنوي: 40$
- ✅ تنبيهات انتهاء الاشتراك
- ✅ ربط حسابات الموظفين بحساب المتجر

---

## 🏗️ **البنية التقنية**

### Frontend (الواجهة)
- **Framework**: React 18 مع React Router 7
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Query
- **Forms**: React Hook Form + Yup

### Backend (الخادم)
- **Runtime**: Node.js
- **Framework**: React Router Hono Server
- **Database**: PostgreSQL (Neon)
- **ORM**: Direct SQL queries مع `@neondatabase/serverless`
- **Authentication**: JWT + Refresh Tokens
- **Password Hashing**: Argon2

### Mobile App
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Storage**: AsyncStorage
- **UI**: React Native components

### Database
- **Provider**: Neon (PostgreSQL)
- **Features**: 
  - Serverless
  - Auto-scaling
  - Branching للبيئات المختلفة
  - Connection pooling

---

## 🚀 **التثبيت والإعداد**

### المتطلبات الأساسية
- Node.js 18+ و npm/yarn
- PostgreSQL (أو حساب Neon)
- Git

### خطوات التثبيت

#### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd createxyz-project
```

#### 2. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات على Neon أو PostgreSQL محلي
# استخدم الـ DATABASE_URL المقدم
DATABASE_URL="postgresql://neondb_owner:npg_SRoDGZ42qWFp@ep-billowing-band-a-adhuxspr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# تشغيل ملف الـ Schema
psql $DATABASE_URL < database-schema.sql
```

#### 3. إعداد تطبيق الويب
```bash
cd create-anything/apps/web

# تثبيت المكتبات
npm install

# إنشاء ملف .env (انظر ENV_EXAMPLE.md)
cp .env.example .env

# تعديل ملف .env وإضافة:
# DATABASE_URL="postgresql://..."
# AUTH_SECRET="your-random-secret-key"

# تشغيل التطبيق
npm run dev
```

التطبيق سيعمل على: `http://localhost:3000`

#### 4. إعداد تطبيق الموبايل
```bash
cd create-anything/apps/mobile

# تثبيت المكتبات
npm install

# إنشاء ملف .env
# API_URL="http://localhost:3000"

# تشغيل التطبيق
npx expo start
```

---

## 🗄️ **قاعدة البيانات**

### الجداول الرئيسية

#### 1. **stores** (المتاجر)
```sql
- id: UUID (PK)
- name: اسم المتجر
- owner_email: بريد المالك
- subscription_plan: نوع الاشتراك
- subscription_expires_at: تاريخ انتهاء الاشتراك
- is_active: نشط/غير نشط
```

#### 2. **users** (المستخدمين)
```sql
- id: UUID (PK)
- store_id: UUID (FK)
- username: اسم المستخدم
- password_hash: كلمة المرور المشفرة
- role: الدور (store_owner, manager, accountant, etc.)
- permissions: JSONB - صلاحيات مخصصة
```

#### 3. **invoices_in** (الواردات)
```sql
- id, store_id, vendor_id
- amount, currency, description
- invoice_date, payment_status
- attachments: JSONB
```

#### 4. **invoices_out** (الصادرات)
```sql
- id, store_id, customer_id
- amount, currency, description
- invoice_date, payment_status
```

#### 5. **inventory_items** (المخزون)
```sql
- id, store_id, sku, name
- current_stock, min_stock
- cost_price, selling_price, currency
```

#### 6. **employees** (الموظفين)
```sql
- id, store_id, full_name
- base_salary, currency
- hire_date, status
```

#### 7. **payroll** (كشوف الرواتب)
```sql
- id, store_id, employee_id
- period_month, period_year
- gross_salary, net_salary
- status: draft, approved, paid
```

### المزايا الأمنية
- **Row Level Security**: كل متجر يرى بياناته فقط
- **Triggers**: تحديث المخزون تلقائياً عند الحركات
- **Indexes**: فهارس محسنة للاستعلامات السريعة
- **Constraints**: قيود للحفاظ على سلامة البيانات

---

## 🔌 **واجهات API**

### المصادقة
```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### الواردات والصادرات
```
GET/POST /api/invoices-in
PUT /api/invoices-in?id=<uuid>
DELETE /api/invoices-in?id=<uuid>

GET/POST /api/invoices-out
PUT /api/invoices-out?id=<uuid>
DELETE /api/invoices-out?id=<uuid>
```

### المخزون
```
GET/POST /api/inventory
PUT /api/inventory?id=<uuid>
DELETE /api/inventory?id=<uuid>
```

### الموظفين
```
GET/POST /api/employees
PUT /api/employees?id=<uuid>
DELETE /api/employees?id=<uuid>
```

### الشركاء
```
GET/POST /api/partners
PUT /api/partners?id=<uuid>
DELETE /api/partners?id=<uuid>
```

### الرواتب
```
GET /api/payroll
POST /api/payroll (generate)
PUT /api/payroll?id=<uuid>&action=<approve|reject|mark_paid>
```

### التقارير
```
GET /api/reports?type=<type>&date_from=<date>&date_to=<date>

أنواع التقارير:
- daily_movement
- profit_loss
- receivables_payables
- inventory_status
- employee_payroll
- partner_statement
```

### الإعدادات
```
GET /api/settings
PUT /api/settings
```

### لوحة التحكم
```
GET /api/dashboard?period=<week|month|quarter|year>
```

---

## 🔒 **الأمان**

### الحماية المطبقة
1. ✅ تشفير كلمات المرور (Argon2)
2. ✅ JWT مع Refresh Tokens
3. ✅ Row Level Security على مستوى قاعدة البيانات
4. ✅ صلاحيات دقيقة لكل عملية
5. ✅ Audit Logs لجميع الأنشطة
6. ✅ التحقق من انتهاء الاشتراك في كل طلب
7. ✅ حماية من SQL Injection (Parameterized queries)
8. ✅ CORS محدود للنطاقات المصرح بها
9. ✅ Rate Limiting (يوصى بإضافته على مستوى السيرفر)
10. ✅ عزل كامل بين المتاجر

### نظام الصلاحيات

#### الأدوار المتاحة:
- **store_owner**: مالك المتجر - صلاحيات كاملة
- **manager**: مدير - صلاحيات واسعة
- **accountant**: محاسب - قراءة وإنشاء وتعديل
- **data_entry**: مدخل بيانات - قراءة وإنشاء فقط
- **warehouse_keeper**: أمين مستودع - إدارة المخزون
- **viewer**: مشاهد - قراءة فقط

#### العمليات المحمية:
- **الحذف**: فقط مالك المتجر
- **اعتماد الرواتب**: مدير أو مالك فقط
- **تعديل الإعدادات**: مدير أو مالك فقط

---

## 🚢 **النشر**

### نشر تطبيق الويب (Vercel - موصى به)

```bash
cd create-anything/apps/web

# تثبيت Vercel CLI
npm install -g vercel

# النشر
vercel

# ضبط متغيرات البيئة على Vercel:
# DATABASE_URL
# AUTH_SECRET
# NODE_ENV=production
```

### نشر تطبيق الموبايل (EAS)

```bash
cd create-anything/apps/mobile

# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# إعداد المشروع
eas build:configure

# بناء APK للأندرويد
eas build --platform android

# بناء IPA للـ iOS
eas build --platform ios
```

### قاعدة البيانات (Neon)
- قاعدة البيانات جاهزة ومتصلة
- استخدم النسخ الاحتياطي التلقائي من Neon
- استخدم Neon Branches للبيئات المختلفة (dev/staging/prod)

---

## 📞 **الدعم والتواصل**

### معلومات الاتصال
- **البريد الإلكتروني**: systemibrahem@gmail.com
- **الهاتف**: +963 994 054 027
- **واتساب**: [+963 994 054 027](https://wa.me/963994054027)

### خطط الاشتراك
| المدة | السعر | التوفير |
|-------|------|---------|
| شهري | 5$ | - |
| 6 أشهر | 30$ | وفر 10% |
| سنوي | 40$ | وفر 33% |

**تجربة مجانية**: 30 يوم بدون بطاقة ائتمان

### طلب الدعم
لطلب الدعم أو الاشتراك:
1. تواصل عبر واتساب
2. أرسل بريد إلكتروني
3. أو اتصل مباشرة

---

## 📝 **ملاحظات مهمة**

### قبل النشر:
1. ⚠️ **غيّر AUTH_SECRET** إلى قيمة عشوائية قوية
2. ⚠️ **تأكد من تشغيل schema.sql** على قاعدة البيانات
3. ⚠️ **اختبر جميع الوظائف** قبل النشر
4. ⚠️ **أضف Rate Limiting** على السيرفر
5. ⚠️ **فعّل HTTPS** في الإنتاج

### التحسينات المستقبلية:
- [ ] تصدير التقارير كـ PDF/Excel
- [ ] إشعارات Firebase للموبايل
- [ ] نظام محادثة للدعم
- [ ] تطبيق iOS
- [ ] واجهة متعددة اللغات (عربي/تركي/إنجليزي)
- [ ] ربط مع بوابات الدفع الإلكتروني

---

## 📄 **الترخيص**

© 2025 نظام إبراهيم للمحاسبة. جميع الحقوق محفوظة.

---

## 🙏 **شكر وتقدير**

تم تطوير هذا النظام باستخدام أفضل الممارسات والتقنيات الحديثة لضمان الأمان والأداء والموثوقية.

**صُمم خصيصاً للشركات العربية** 🇸🇾 🇹🇷 🇺🇸

