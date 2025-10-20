# 📱 ملاحظة حول تطبيق الموبايل

## ℹ️ **تنبيه**

تم **إزالة مجلد mobile** من هذا المستودع لأن:

1. **Netlify يحتاج فقط تطبيق الويب**
2. تطبيق الموبايل يسبب مشاكل في البناء على Netlify
3. تطبيق الموبايل منفصل ولا يحتاج النشر على Netlify

---

## 📱 **أين تطبيق الموبايل؟**

تطبيق الموبايل موجود في المجلد الأصلي:
```
C:\Users\SANND\Desktop\createxyz-project (5)\create-anything\apps\mobile
```

---

## 🚀 **كيف تنشر تطبيق الموبايل؟**

### استخدم EAS Build:

```bash
# من المجلد الأصلي
cd "C:\Users\SANND\Desktop\createxyz-project (5)\create-anything\apps\mobile"

# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل دخول
eas login

# بناء APK
eas build --platform android --profile production
```

---

## 📂 **هذا المستودع يحتوي على:**

- ✅ تطبيق الويب فقط (`apps/web/`)
- ✅ قاعدة البيانات (`database-schema.sql`)
- ✅ التوثيق الكامل
- ✅ إعدادات Netlify

---

## ✅ **كل شيء على ما يرام**

هذا طبيعي ومقصود. تطبيق الويب فقط يُنشر على Netlify.

تطبيق الموبايل منفصل ويُبنى باستخدام EAS.

---

**© 2025 نظام إبراهيم للمحاسبة**

