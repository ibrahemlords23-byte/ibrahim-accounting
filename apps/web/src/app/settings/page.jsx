'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, Building2, User, Mail,
  Phone, MapPin, Globe, DollarSign, Moon, Sun
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    store: {
      name: '',
      owner_name: '',
      owner_phone: '',
      address: '',
      logo_url: ''
    },
    preferences: {
      default_currency: 'USD',
      locale: 'ar',
      dark_mode: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSettings({
            store: data.data.store || settings.store,
            preferences: data.data.store?.settings || settings.preferences
          });
        }
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_settings: {
            name: settings.store.name,
            owner_name: settings.store.owner_name,
            owner_phone: settings.store.owner_phone,
            address: settings.store.address,
            logo_url: settings.store.logo_url,
            settings: settings.preferences
          }
        })
      });

      if (response.ok) {
        alert('تم حفظ الإعدادات بنجاح');
      } else {
        alert('خطأ في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      alert('خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleStoreChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      store: {
        ...prev.store,
        [field]: value
      }
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">جاري تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الإعدادات</h1>
            <p className="text-sm text-gray-600">إعدادات المتجر والتفضيلات</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* معلومات المتجر */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <Building2 className="h-5 w-5 ml-2" />
            معلومات المتجر
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المتجر
              </label>
              <input
                type="text"
                value={settings.store.name}
                onChange={(e) => handleStoreChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المالك
              </label>
              <input
                type="text"
                value={settings.store.owner_name}
                onChange={(e) => handleStoreChange('owner_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={settings.store.owner_phone}
                  onChange={(e) => handleStoreChange('owner_phone', e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={settings.store.address}
                  onChange={(e) => handleStoreChange('address', e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* التفضيلات */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center">
            <SettingsIcon className="h-5 w-5 ml-2" />
            التفضيلات
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العملة الافتراضية
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={settings.preferences.default_currency}
                  onChange={(e) => handlePreferenceChange('default_currency', e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">دولار أمريكي ($)</option>
                  <option value="TRY">ليرة تركية (₺)</option>
                  <option value="SYP">ليرة سورية (ل.س)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اللغة
              </label>
              <div className="relative">
                <Globe className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={settings.preferences.locale}
                  onChange={(e) => handlePreferenceChange('locale', e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {settings.preferences.dark_mode ? (
                  <Moon className="h-5 w-5 ml-2 text-gray-700" />
                ) : (
                  <Sun className="h-5 w-5 ml-2 text-gray-700" />
                )}
                <div>
                  <p className="font-medium text-gray-900">الوضع الليلي</p>
                  <p className="text-sm text-gray-600">تفعيل الوضع الليلي للواجهة</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preferences.dark_mode}
                  onChange={(e) => handlePreferenceChange('dark_mode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* معلومات الاشتراك */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-bold mb-4 text-blue-800">معلومات الاشتراك</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">الخطة الحالية</p>
              <p className="text-lg font-bold text-blue-800">
                {settings.store.subscription_plan === 'trial' ? 'تجربة مجانية' :
                 settings.store.subscription_plan === 'monthly' ? 'شهري' :
                 settings.store.subscription_plan === 'semi_annual' ? '6 أشهر' :
                 settings.store.subscription_plan === 'annual' ? 'سنوي' : 'غير محدد'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">صالح حتى</p>
              <p className="text-lg font-bold text-blue-800">
                {settings.store.subscription_expires_at 
                  ? new Date(settings.store.subscription_expires_at).toLocaleDateString('ar-EG')
                  : 'غير محدد'}
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/963994054027"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            📱 تجديد الاشتراك عبر واتساب
          </a>
        </div>
      </div>
    </div>
  );
}

