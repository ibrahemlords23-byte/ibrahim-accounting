'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Calendar, CheckCircle, XCircle, Clock,
  Eye, Download, Filter
} from 'lucide-react';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadPayrolls();
  }, [selectedYear, selectedMonth, statusFilter]);

  const loadPayrolls = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.append('year', selectedYear);
      if (selectedMonth) params.append('month', selectedMonth);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/payroll?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPayrolls(data.data);
      }
    } catch (error) {
      console.error('Load payrolls error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!confirm(`هل تريد توليد كشوف رواتب شهر ${selectedMonth}/${selectedYear}؟`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period_month: selectedMonth,
          period_year: selectedYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadPayrolls();
      } else {
        const data = await response.json();
        alert(data.error || 'خطأ في توليد كشوف الرواتب');
      }
    } catch (error) {
      console.error('Generate payroll error:', error);
      alert('خطأ في توليد كشوف الرواتب');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('هل تريد اعتماد هذا الكشف؟')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/payroll?id=${id}&action=approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('تم اعتماد الكشف بنجاح');
        loadPayrolls();
      } else {
        const data = await response.json();
        alert(data.error || 'خطأ في اعتماد الكشف');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('خطأ في اعتماد الكشف');
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${parseFloat(amount || 0).toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'معتمد', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'paid':
        return { label: 'مدفوع', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
      case 'draft':
      default:
        return { label: 'مسودة', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const months = [
    { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">كشوف الرواتب</h1>
            <p className="text-sm text-gray-600">إدارة رواتب الموظفين</p>
          </div>
          <button 
            onClick={handleGeneratePayroll}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>توليد كشوف رواتب</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* الفلاتر */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السنة
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الشهر
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الأشهر</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">جميع الحالات</option>
                <option value="draft">مسودة</option>
                <option value="approved">معتمد</option>
                <option value="paid">مدفوع</option>
              </select>
            </div>
          </div>
        </div>

        {/* جدول كشوف الرواتب */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الموظف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الفترة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الراتب الأساسي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">السلف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الخصومات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المكافآت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الصافي</th>
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
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    لا توجد كشوف رواتب
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => {
                  const statusBadge = getStatusBadge(payroll.status);
                  const StatusIcon = statusBadge.icon;
                  
                  return (
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payroll.employee_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payroll.period_month}/{payroll.period_year}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(payroll.gross_salary, payroll.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {formatCurrency(payroll.total_advances, payroll.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {formatCurrency(payroll.total_deductions, payroll.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {formatCurrency(payroll.total_bonuses, payroll.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">
                        {formatCurrency(payroll.net_salary, payroll.currency)}
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
                          {payroll.status === 'draft' && (
                            <button 
                              onClick={() => handleApprove(payroll.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button className="text-purple-600 hover:text-purple-800">
                            <Download className="h-4 w-4" />
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

