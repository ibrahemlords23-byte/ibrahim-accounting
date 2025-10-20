'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Eye, UserCheck,
  Phone, Mail, DollarSign, Calendar, Briefcase
} from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadEmployees();
  }, [search, statusFilter]);

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/employees?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data.employees);
        setStats(data.data.stats || []);
      }
    } catch (error) {
      console.error('Load employees error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('تم حذف الموظف بنجاح');
        loadEmployees();
      } else {
        const data = await response.json();
        alert(data.error || 'خطأ في حذف الموظف');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('خطأ في حذف الموظف');
    }
  };

  const formatCurrency = (amount, currency) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${parseFloat(amount || 0).toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { label: 'نشط', color: 'bg-green-100 text-green-800' };
      case 'inactive':
        return { label: 'غير نشط', color: 'bg-gray-100 text-gray-800' };
      case 'terminated':
        return { label: 'منتهي الخدمة', color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة الموظفين</h1>
            <p className="text-sm text-gray-600">بيانات الموظفين والرواتب</p>
          </div>
          <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5" />
            <span>إضافة موظف جديد</span>
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
                    <p className="text-sm text-gray-600">{stat.status === 'active' ? 'موظفين نشطين' : 'إجمالي'}</p>
                    <p className="text-2xl font-bold text-blue-600">{stat.count}</p>
                  </div>
                  <UserCheck className="h-10 w-10 text-blue-600" />
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
                placeholder="بحث بالاسم أو الكود أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="terminated">منتهي الخدمة</option>
            </select>
          </div>
        </div>

        {/* جدول الموظفين */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الكود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المنصب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">القسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الراتب الأساسي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">تاريخ التوظيف</th>
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
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    لا يوجد موظفين
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const statusBadge = getStatusBadge(employee.status);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.employee_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {employee.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 ml-1" />
                          {employee.position || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.department || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 ml-1" />
                          {formatCurrency(employee.base_salary, employee.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 ml-1" />
                          {new Date(employee.hire_date).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusBadge.color}`}>
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
                            onClick={() => handleDelete(employee.id)}
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

