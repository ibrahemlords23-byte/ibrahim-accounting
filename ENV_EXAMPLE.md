# ملفات البيئة المطلوبة

## للويب (create-anything/apps/web/.env)

```env
# قاعدة البيانات - Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_SRoDGZ42qWFp@ep-billowing-band-a-adhuxspr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# مفتاح التشفير والمصادقة (يجب تغييره في الإنتاج)
AUTH_SECRET="ibrahim-accounting-secret-key-change-this-in-production"

# بيئة التشغيل
NODE_ENV="development"

# عنوان التطبيق
APP_URL="http://localhost:3000"

# إعدادات JWT
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# معلومات الاتصال
CONTACT_EMAIL="systemibrahem@gmail.com"
CONTACT_PHONE="+963994054027"
WHATSAPP_NUMBER="963994054027"

# خطط الاشتراك (بالدولار)
SUBSCRIPTION_MONTHLY_PRICE="5"
SUBSCRIPTION_SEMI_ANNUAL_PRICE="30"
SUBSCRIPTION_ANNUAL_PRICE="40"
SUBSCRIPTION_TRIAL_DAYS="30"
```

## للموبايل (create-anything/apps/mobile/.env)

```env
# عنوان API الخلفي
API_URL="http://localhost:3000"

# عنوان API للإنتاج
# API_URL="https://your-domain.com"

# معلومات الاتصال
CONTACT_EMAIL="systemibrahem@gmail.com"
CONTACT_PHONE="+963994054027"
WHATSAPP_NUMBER="963994054027"
```

## تعليمات الإعداد

1. انسخ المحتوى أعلاه إلى ملف `.env` في المجلد المناسب
2. غيّر `AUTH_SECRET` إلى قيمة عشوائية قوية في الإنتاج
3. تأكد من أن `DATABASE_URL` يشير إلى قاعدة البيانات الصحيحة
4. عدّل `APP_URL` و `API_URL` حسب بيئة النشر

