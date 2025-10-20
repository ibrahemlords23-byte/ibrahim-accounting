'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, Plus, Search, Edit, Trash2, Eye,
  Calendar, CheckCircle, XCircle, Clock
} from 'lucide-react';

export default function InvoicesOutPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [search, currencyFilter, paymentStatusFilter]);

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (currencyFilter) params.append('currency', currencyFilter);
      if (paymentStatusFilter) params.append('payment_status', paymentStatusFilter);
      
      const response = await fetch(`/api/invoices-out?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data.invoices);
        setStats(data.data.stats || []);
      }
    } catch (error) {
      console.error('Load invoices error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصادر؟')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/invoices-out?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('تم حذف الصادر بنجاح');
        loadInvoices();
      } else {
        const data = await response.json();
        alert(data.error || 'خطأ في حذف الصادر');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('خطأ في حذف الصادر');
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${parseFloat(amount || 0).toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return { label: 'مدفوع', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'partial':
        return { label: 'مدفوع جزئياً', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'unpaid':
      default:
        return { label: 'غير مدفوع', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الصادرات</h1>
            <p className="text-sm text-gray-600">إدارة المبيعات والإيرادات</p>
          </div>
          <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            <span>صادر جديد</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* الإحصائيات */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الصادرات ({stat.currency})</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {formatCurrency(stat.total_amount, stat.currency)}
                    </p>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">مدفوع: {formatCurrency(stat.total_paid, stat.currency)}</p>
                      <p className="text-red-600">متبقي: {formatCurrency(stat.total_remaining, stat.currency)}</p>
                    </div>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* الفلاتر والبحث */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة أو البيان..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع العملات</option>
              <option value="USD">دولار ($)</option>
              <option value="TRY">ليرة تركية (₺)</option>
              <option value="SYP">ليرة سورية (ل.س)</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="paid">مدفوع</option>
              <option value="partial">مدفوع جزئياً</option>
              <option value="unpaid">غير مدفوع</option>
            </select>
          </div>
        </div>

        {/* جدول الصادرات */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">رقم الفاتورة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">العميل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">البيان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المدفوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    لا توجد صادرات
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const statusBadge = getPaymentStatusBadge(invoice.payment_status);
                  const StatusIcon = statusBadge.icon;
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {invoice.invoice_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 ml-1" />
                          {new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.customer_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {invoice.description.substring(0, 30)}...
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {formatCurrency(invoice.paid_amount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center w-fit ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

