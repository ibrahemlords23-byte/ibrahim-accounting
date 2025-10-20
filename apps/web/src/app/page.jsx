"use client";

import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Building, Phone, Mail } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem("auth_token", data.tokens.accessToken);
        localStorage.setItem("refresh_token", data.tokens.refreshToken);
        localStorage.setItem("user_data", JSON.stringify(data.user));

        // إعادة توجيه إلى لوحة التحكم
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "فشل تسجيل الدخول");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="max-w-md w-full">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <img
              src="https://ucarecdn.com/2d35ff43-a505-4b03-80df-f66fd4eabaaa/-/format/auto/"
              alt="شعار نظام إبراهيم للمحاسبة"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            نظام إبراهيم للمحاسبة
          </h1>
          <p className="text-gray-600">نظام شامل لإدارة الحسابات والمخزون</p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            تسجيل الدخول
          </h2>

          {error && (
            <div className="bg-red-50 border-r-4 border-red-400 p-4 mb-6 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
                <User className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل كلمة المرور"
                  required
                />
                <Lock className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          {/* معلومات النظام */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">
              مرحباً بك في نظام إبراهيم للمحاسبة
            </h3>
            <p className="text-xs text-gray-600 text-center">
              نظام متكامل لإدارة الحسابات والمخزون والموظفين مع دعم العملات
              المتعددة
            </p>
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
            اتصل بنا
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-center text-gray-600">
              <Mail className="h-5 w-5 ml-2" />
              <span className="text-sm">systemibrahem@gmail.com</span>
            </div>
            <div className="flex items-center justify-center text-gray-600">
              <Phone className="h-5 w-5 ml-2" />
              <span className="text-sm">+963 994 054 027</span>
            </div>
            <div className="text-center">
              <a
                href="https://wa.me/963994054027"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <span className="ml-2">📱</span>
                واتساب
              </a>
            </div>
          </div>
        </div>

        {/* خطط الاشتراك */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
            خطط الاشتراك
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>شهري</span>
              <span className="font-medium text-blue-600">5$</span>
            </div>
            <div className="flex justify-between">
              <span>6 أشهر</span>
              <span className="font-medium text-blue-600">30$</span>
            </div>
            <div className="flex justify-between">
              <span>سنوي</span>
              <span className="font-medium text-green-600">40$</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a
              href="https://wa.me/963994054027?text=مرحباً، أريد الاستفسار عن خطط الاشتراك"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              اتصل بنا للاشتراك أو الترقية
            </a>
          </div>
        </div>

        {/* حقوق الطبع */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 نظام إبراهيم للمحاسبة. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
}
