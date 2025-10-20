'use client';

import { useState } from 'react';
import { 
  FileText, Download, Calendar, DollarSign, TrendingUp,
  TrendingDown, Package, Users, BarChart3
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily_movement');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currency, setCurrency] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'daily_movement', label: 'تقرير الحركة اليومية', icon: BarChart3 },
    { value: 'profit_loss', label: 'تقرير الأرباح والخسائر', icon: TrendingUp },
    { value: 'receivables_payables', label: 'تقرير الذمم', icon: DollarSign },
    { value: 'inventory_status', label: 'تقرير حالة المخزون', icon: Package },
    { value: 'employee_payroll', label: 'تقرير كشف الرواتب', icon: Users },
  ];

  const loadReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.append('type', reportType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (currency) params.append('currency', currency);
      
      const response = await fetch(`/api/reports?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.data);
      } else {
        alert('خطأ في تحميل التقرير');
      }
    } catch (error) {
      console.error('Load report error:', error);
      alert('خطأ في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, curr) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${parseFloat(amount || 0).toLocaleString('ar-EG')} ${symbols[curr] || curr}`;
  };

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center text-gray-500 py-12">
          اختر نوع التقرير والمعايير ثم اضغط "عرض التقرير"
        </div>
      );
    }

    switch (reportType) {
      case 'profit_loss':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">تقرير الأرباح والخسائر</h3>
            {reportData.profitLoss && reportData.profitLoss.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">العملة: {item.currency}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الواردات</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(item.total_incoming, item.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الصادرات</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(item.total_outgoing, item.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">صافي الربح</p>
                    <p className={`text-xl font-bold ${item.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(item.net_profit, item.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'receivables_payables':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">تقرير الذمم المدينة والدائنة</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-bold mb-4">الذمم المدينة (المستحقة لنا)</h4>
                {reportData.receivables && reportData.receivables.map((item, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-sm text-gray-600">{item.currency}</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(item.total_due, item.currency)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-red-50 rounded-lg p-6">
                <h4 className="font-bold mb-4">الذمم الدائنة (المستحقة علينا)</h4>
                {reportData.payables && reportData.payables.map((item, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-sm text-gray-600">{item.currency}</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(item.total_due, item.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'inventory_status':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">تقرير حالة المخزون</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right">التصنيف</th>
                    <th className="px-4 py-2 text-right">إجمالي الأصناف</th>
                    <th className="px-4 py-2 text-right">مخزون منخفض</th>
                    <th className="px-4 py-2 text-right">نفذ من المخزون</th>
                    <th className="px-4 py-2 text-right">القيمة الإجمالية</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.inventory && reportData.inventory.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{item.category || 'غير مصنف'}</td>
                      <td className="px-4 py-2">{item.total_items}</td>
                      <td className="px-4 py-2 text-orange-600">{item.low_stock_items}</td>
                      <td className="px-4 py-2 text-red-600">{item.out_of_stock_items}</td>
                      <td className="px-4 py-2">{formatCurrency(item.total_value, item.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-12">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>تم تحميل التقرير بنجاح</p>
            <pre className="mt-4 text-left bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">التقارير</h1>
            <p className="text-sm text-gray-600">تقارير مفصلة عن جميع العمليات</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-5 w-5" />
            <span>تصدير / طباعة</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* خيارات التقرير */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">معايير التقرير</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع التقرير
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العملة (اختياري)
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع العملات</option>
                <option value="USD">دولار ($)</option>
                <option value="TRY">ليرة تركية (₺)</option>
                <option value="SYP">ليرة سورية (ل.س)</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadReport}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : 'عرض التقرير'}
          </button>
        </div>

        {/* محتوى التقرير */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-12">
              جاري تحميل التقرير...
            </div>
          ) : (
            renderReportContent()
          )}
        </div>
      </div>
    </div>
  );
}

