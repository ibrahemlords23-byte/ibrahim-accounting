'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  AlertTriangle,
  DollarSign,
  Eye,
  Plus,
  Bell,
  Settings,
  LogOut,
  Home,
  FileText,
  Warehouse,
  UserCheck,
  Moon,
  Sun,
  Globe
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    // التحقق من المصادقة
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (!token || !userData) {
      window.location.href = '/';
      return;
    }

    try {
      setUser(JSON.parse(userData));
      setDarkMode(JSON.parse(userData).darkMode || false);
    } catch {
      window.location.href = '/';
      return;
    }

    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/dashboard?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const formatCurrency = (amount, currency) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${amount?.toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
  };

  const getSubscriptionStatus = () => {
    if (!user?.subscription_expires_at) return 'غير محدد';
    
    const expiry = new Date(user.subscription_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return 'منتهي الصلاحية';
    if (daysLeft <= 7) return `${daysLeft} أيام متبقية`;
    return `صالح حتى ${expiry.toLocaleDateString('ar-EG')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`} dir="rtl">
      {/* الشريط العلوي */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img 
              src="https://ucarecdn.com/2d35ff43-a505-4b03-80df-f66fd4eabaaa/-/format/auto/" 
              alt="شعار النظام" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-xl font-bold">نظام إبراهيم للمحاسبة</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.storeName} - {user?.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            {/* حالة الاشتراك */}
            <div className={`px-3 py-1 rounded-full text-xs ${
              getSubscriptionStatus().includes('منتهي') 
                ? 'bg-red-100 text-red-800' 
                : getSubscriptionStatus().includes('أيام')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              {getSubscriptionStatus()}
            </div>

            {/* الإشعارات */}
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative`}>
              <Bell className="h-5 w-5" />
              {dashboardData?.alerts?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {dashboardData.alerts.length}
                </span>
              )}
            </button>

            {/* الوضع الليلي */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* الشريط الجانبي */}
        <nav className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'} min-h-screen p-6`}>
          <div className="space-y-2">
            <a href="/dashboard" className="flex items-center space-x-3 space-x-reverse px-4 py-3 bg-blue-50 text-blue-700 rounded-lg">
              <Home className="h-5 w-5" />
              <span>لوحة التحكم</span>
            </a>
            <a href="/invoices-in" className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <TrendingDown className="h-5 w-5" />
              <span>الواردات</span>
            </a>
            <a href="/invoices-out" className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <TrendingUp className="h-5 w-5" />
              <span>الصادرات</span>
            </a>
            <a href="/inventory" className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <Warehouse className="h-5 w-5" />
              <span>المستودع</span>
            </a>
            <a href="/employees" className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <UserCheck className="h-5 w-5" />
              <span>الموظفون</span>
            </a>
            <a href="/reports" className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <FileText className="h-5 w-5" />
              <span>التقارير</span>
            </a>
            <a href="/settings" className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
              <Settings className="h-5 w-5" />
              <span>الإعدادات</span>
            </a>
          </div>

          {/* زر الواتساب للترقية */}
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">ترقية الحساب</h3>
            <p className="text-xs text-green-600 mb-3">احصل على ميزات إضافية</p>
            <a
              href="https://wa.me/963994054027"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              📱 واتساب
            </a>
          </div>
        </nav>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-6">
          {/* فلتر الفترة */}
          <div className="mb-6 flex items-center space-x-4 space-x-reverse">
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              الفترة:
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            >
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
              <option value="quarter">آخر 3 أشهر</option>
              <option value="year">آخر سنة</option>
            </select>
          </div>

          {/* البطاقات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* إجمالي الواردات */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي الواردات</p>
                  <div className="mt-2">
                    {dashboardData?.summary?.incoming?.map((item, index) => (
                      <p key={index} className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(item.total_amount), item.currency)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* إجمالي الصادرات */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي الصادرات</p>
                  <div className="mt-2">
                    {dashboardData?.summary?.outgoing?.map((item, index) => (
                      <p key={index} className="text-lg font-bold text-red-600">
                        {formatCurrency(parseFloat(item.total_amount), item.currency)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* أصناف المخزون */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>أصناف المخزون</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.inventory?.total_items || 0}
                  </p>
                  <p className="text-sm text-red-600">
                    {dashboardData?.inventory?.low_stock_items || 0} قليل المخزون
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* الموظفون */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الموظفون</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.employees?.active_employees || 0}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    من أصل {dashboardData?.employees?.total_employees || 0}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* التنبيهات */}
          {dashboardData?.alerts?.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-8`}>
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 ml-2" />
                التنبيهات الأخيرة
              </h2>
              <div className="space-y-3">
                {dashboardData.alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border-r-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-400' :
                    alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <h3 className="font-medium text-sm">{alert.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* أهم الشركاء */}
          {dashboardData?.topPartners?.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <h2 className="text-lg font-bold mb-4">أهم العملاء والموردين</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-right py-2">الاسم</th>
                      <th className="text-right py-2">النوع</th>
                      <th className="text-right py-2">المبيعات</th>
                      <th className="text-right py-2">المشتريات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topPartners.slice(0, 10).map((partner) => (
                      <tr key={partner.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className="py-2">{partner.name}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            partner.type === 'customer' ? 'bg-green-100 text-green-800' :
                            partner.type === 'vendor' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {partner.type === 'customer' ? 'عميل' : 
                             partner.type === 'vendor' ? 'مورد' : 'عميل ومورد'}
                          </span>
                        </td>
                        <td className="py-2 text-green-600">
                          {parseFloat(partner.sales_amount || 0).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-2 text-blue-600">
                          {parseFloat(partner.purchase_amount || 0).toLocaleString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}