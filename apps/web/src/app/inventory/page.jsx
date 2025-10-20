'use client';

import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Filter, AlertTriangle, 
  Edit, Trash2, Eye, TrendingUp, TrendingDown 
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [search, lowStockOnly]);

  const loadInventory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStockOnly) params.append('low_stock', 'true');
      
      const response = await fetch(`/api/inventory?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data.items);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Load inventory error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${parseFloat(amount || 0).toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة المخزون</h1>
            <p className="text-sm text-gray-600">إدارة الأصناف والحركات المخزنية</p>
          </div>
          <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* الإحصائيات */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الأصناف</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total_items || 0}</p>
                </div>
                <Package className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">مخزون منخفض</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.low_stock_items || 0}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">نفذ من المخزون</p>
                  <p className="text-2xl font-bold text-red-600">{stats.out_of_stock_items || 0}</p>
                </div>
                <TrendingDown className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">قيمة المخزون</p>
                  <p className="text-xl font-bold text-green-600">
                    {parseFloat(stats.total_inventory_value || 0).toLocaleString('ar-EG')}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* الفلاتر والبحث */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg border ${
                lowStockOnly ? 'bg-orange-100 border-orange-500 text-orange-700' : 'border-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>مخزون منخفض فقط</span>
            </button>
          </div>
        </div>

        {/* جدول الأصناف */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الكود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الوحدة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المخزون الحالي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحد الأدنى</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">سعر التكلفة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">سعر البيع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    لا توجد أصناف
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${
                        parseFloat(item.current_stock) <= parseFloat(item.min_stock)
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.min_stock}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(item.cost_price, item.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(item.selling_price, item.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {parseFloat(item.current_stock) <= parseFloat(item.min_stock) ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          منخفض
                        </span>
                      ) : parseFloat(item.current_stock) === 0 ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          نفذ
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          متوفر
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

