import React from 'react';
import { Tabs } from 'expo-router';
import { 
  Home,
  TrendingDown,
  TrendingUp,
  Warehouse,
  UserCheck,
  FileText,
  Settings
} from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="invoices-in"
        options={{
          title: 'الواردات',
          tabBarIcon: ({ color, size }) => (
            <TrendingDown size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="invoices-out"
        options={{
          title: 'الصادرات',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'المستودع',
          tabBarIcon: ({ color, size }) => (
            <Warehouse size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="employees"
        options={{
          title: 'الموظفون',
          tabBarIcon: ({ color, size }) => (
            <UserCheck size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'التقارير',
          tabBarIcon: ({ color, size }) => (
            <FileText size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}