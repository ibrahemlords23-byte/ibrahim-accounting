'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, Eye, Phone, Mail,
  MapPin, FileText, Building2
} from 'lucide-react';

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  useEffect(() => {
    loadPartners();
  }, [search, typeFilter]);

  const loadPartners = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      
      const response = await fetch(`/api/partners?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data.data.partners);
      }
    } catch (error) {
      console.error('Load partners error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/partners?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('تم حذف الشريك بنجاح');
        loadPartners();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('خطأ في حذف الشريك');
    }
  };

  const getTypeLabel = (type) => {
    return type === 'customer' ? 'عميل' : type === 'vendor' ? 'مورد' : 'عميل ومورد';
  };

  const getTypeBadgeColor = (type) => {
    return type === 'customer' ? 'bg-green-100 text-green-800' :
           type === 'vendor' ? 'bg-blue-100 text-blue-800' :
           'bg-purple-100 text-purple-800';
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">إدارة الشركاء</h1>
            <p className="text-sm text-gray-600">العملاء والموردين</p>
          </div>
          <button 
            onClick={() => { setEditingPartner(null); setShowModal(true); }}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة شريك جديد</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* الفلاتر والبحث */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأنواع</option>
              <option value="customer">عملاء</option>
              <option value="vendor">موردين</option>
              <option value="both">عميل ومورد</option>
            </select>
          </div>
        </div>

        {/* جدول الشركاء */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الكود</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الاسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">العنوان</th>
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
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    لا يوجد شركاء
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {partner.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{partner.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeColor(partner.type)}`}>
                        {getTypeLabel(partner.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 ml-1" />
                        {partner.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 ml-1" />
                        {partner.email || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 ml-1" />
                        {partner.address ? partner.address.substring(0, 20) + '...' : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        partner.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {partner.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button 
                          onClick={() => {/* عرض التفاصيل */}}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setEditingPartner(partner); setShowModal(true); }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(partner.id)}
                          className="text-red-600 hover:text-red-800"
                        >
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

