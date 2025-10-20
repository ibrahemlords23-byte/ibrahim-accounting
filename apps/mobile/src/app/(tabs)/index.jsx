import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  AlertTriangle,
  Bell,
  LogOut,
  Moon,
  Sun,
  Plus,
  Eye
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAuthAndLoadData();
  }, [selectedPeriod]);

  const checkAuthAndLoadData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (!token || !userData) {
        router.replace('/');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setDarkMode(parsedUser.darkMode || false);
      
      await loadDashboardData();
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`/api/dashboard?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else if (response.status === 401) {
        await AsyncStorage.clear();
        router.replace('/');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          }
        }
      ]
    );
  };

  const formatCurrency = (amount, currency) => {
    const symbols = { 'USD': '$', 'TRY': '₺', 'SYP': 'ل.س' };
    return `${amount?.toLocaleString('ar-EG')} ${symbols[currency] || currency}`;
  };

  const getSubscriptionStatus = () => {
    if (!user?.subscription_expires_at) return { text: 'غير محدد', color: '#6b7280' };
    
    const expiry = new Date(user.subscription_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { text: 'منتهي الصلاحية', color: '#dc2626' };
    if (daysLeft <= 7) return { text: `${daysLeft} أيام متبقية`, color: '#f59e0b' };
    return { text: `صالح حتى ${expiry.toLocaleDateString('ar-EG')}`, color: '#16a34a' };
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/963994054027');
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: darkMode ? '#111827' : '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: insets.top
      }}>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <Text style={{
          fontSize: 16,
          color: darkMode ? '#e5e7eb' : '#6b7280',
          textAlign: 'center'
        }}>
          جاري تحميل البيانات...
        </Text>
      </View>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <View style={{
      flex: 1,
      backgroundColor: darkMode ? '#111827' : '#f8fafc',
      paddingTop: insets.top
    }}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />

      {/* الشريط العلوي */}
      <View style={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: darkMode ? '#374151' : '#e5e7eb'
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: 'https://ucarecdn.com/2d35ff43-a505-4b03-80df-f66fd4eabaaa/-/format/auto/' }}
              style={{ width: 32, height: 32, marginLeft: 12 }}
            />
            <View>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: darkMode ? '#ffffff' : '#1f2937'
              }}>
                نظام إبراهيم للمحاسبة
              </Text>
              <Text style={{
                fontSize: 12,
                color: darkMode ? '#9ca3af' : '#6b7280'
              }}>
                {user?.storeName} - {user?.fullName}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* الإشعارات */}
            <TouchableOpacity style={{
              padding: 8,
              marginLeft: 8,
              position: 'relative'
            }}>
              <Bell size={20} color={darkMode ? '#e5e7eb' : '#6b7280'} />
              {dashboardData?.alerts?.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: '#ef4444',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {dashboardData.alerts.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* تسجيل الخروج */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: '#dc2626',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6
              }}
            >
              <LogOut size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* حالة الاشتراك */}
        <View style={{
          marginTop: 12,
          backgroundColor: subscriptionStatus.color === '#dc2626' ? '#fef2f2' :
                          subscriptionStatus.color === '#f59e0b' ? '#fffbeb' : '#f0fdf4',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          alignSelf: 'flex-start'
        }}>
          <Text style={{
            fontSize: 12,
            color: subscriptionStatus.color,
            fontWeight: '500'
          }}>
            {subscriptionStatus.text}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* البطاقات الرئيسية */}
        <View style={{ gap: 16, marginBottom: 24 }}>
          {/* إجمالي الواردات */}
          <View style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: 8
                }}>
                  إجمالي الواردات
                </Text>
                {dashboardData?.summary?.incoming?.map((item, index) => (
                  <Text key={index} style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#16a34a',
                    marginBottom: 4
                  }}>
                    {formatCurrency(parseFloat(item.total_amount), item.currency)}
                  </Text>
                ))}
              </View>
              <View style={{
                backgroundColor: '#dcfce7',
                padding: 12,
                borderRadius: 12
              }}>
                <TrendingUp size={24} color="#16a34a" />
              </View>
            </View>
          </View>

          {/* إجمالي الصادرات */}
          <View style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: 8
                }}>
                  إجمالي الصادرات
                </Text>
                {dashboardData?.summary?.outgoing?.map((item, index) => (
                  <Text key={index} style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#dc2626',
                    marginBottom: 4
                  }}>
                    {formatCurrency(parseFloat(item.total_amount), item.currency)}
                  </Text>
                ))}
              </View>
              <View style={{
                backgroundColor: '#fee2e2',
                padding: 12,
                borderRadius: 12
              }}>
                <TrendingDown size={24} color="#dc2626" />
              </View>
            </View>
          </View>

          {/* المخزون والموظفون */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{
              flex: 1,
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4
            }}>
              <View style={{ alignItems: 'center' }}>
                <Package size={24} color="#2563eb" style={{ marginBottom: 8 }} />
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  textAlign: 'center'
                }}>
                  {dashboardData?.inventory?.total_items || 0}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  textAlign: 'center'
                }}>
                  أصناف المخزون
                </Text>
                {dashboardData?.inventory?.low_stock_items > 0 && (
                  <Text style={{
                    fontSize: 11,
                    color: '#dc2626',
                    textAlign: 'center',
                    marginTop: 4
                  }}>
                    {dashboardData.inventory.low_stock_items} قليل المخزون
                  </Text>
                )}
              </View>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4
            }}>
              <View style={{ alignItems: 'center' }}>
                <Users size={24} color="#7c3aed" style={{ marginBottom: 8 }} />
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  textAlign: 'center'
                }}>
                  {dashboardData?.employees?.active_employees || 0}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  textAlign: 'center'
                }}>
                  موظف نشط
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* التنبيهات */}
        {dashboardData?.alerts?.length > 0 && (
          <View style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: darkMode ? '#ffffff' : '#1f2937',
              marginBottom: 16
            }}>
              <AlertTriangle size={18} color="#f59e0b" /> التنبيهات الأخيرة
            </Text>
            
            {dashboardData.alerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={{
                backgroundColor: alert.severity === 'critical' ? '#fef2f2' :
                                alert.severity === 'warning' ? '#fffbeb' : '#eff6ff',
                borderRightWidth: 4,
                borderRightColor: alert.severity === 'critical' ? '#dc2626' :
                                 alert.severity === 'warning' ? '#f59e0b' : '#2563eb',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1f2937',
                  marginBottom: 4
                }}>
                  {alert.title}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280'
                }}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* دعوة لترقية الحساب */}
        <View style={{
          backgroundColor: '#f0fdf4',
          borderRadius: 12,
          padding: 20,
          borderWidth: 1,
          borderColor: '#22c55e'
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#15803d',
            marginBottom: 8,
            textAlign: 'center'
          }}>
            ترقية الحساب
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#166534',
            textAlign: 'center',
            marginBottom: 16
          }}>
            احصل على ميزات إضافية ومساحة تخزين أكبر
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#16a34a',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              alignItems: 'center'
            }}
            onPress={openWhatsApp}
          >
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600'
            }}>
              📱 تواصل عبر واتساب
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}