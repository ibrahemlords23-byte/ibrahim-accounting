import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Eye, EyeOff, User, Lock, Phone, Mail } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      const userData = await AsyncStorage.getItem("user_data");

      if (token && userData) {
        router.replace("/(tabs)");
        return;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert("خطأ", "يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoginLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // حفظ بيانات المستخدم
        await AsyncStorage.multiSet([
          ["auth_token", data.tokens.accessToken],
          ["refresh_token", data.tokens.refreshToken],
          ["user_data", JSON.stringify(data.user)],
        ]);

        router.replace("/(tabs)");
      } else {
        Alert.alert("خطأ", data.error || "فشل تسجيل الدخول");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("خطأ", "خطأ في الاتصال بالخادم");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const openWhatsApp = () => {
    Linking.openURL("https://wa.me/963994054027");
  };

  const openWhatsAppUpgrade = () => {
    Linking.openURL(
      "https://wa.me/963994054027?text=مرحباً، أريد الاستفسار عن خطط الاشتراك",
    );
  };

  // إذا كان يتحقق من المصادقة
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <StatusBar style="dark" />
        <Text
          style={{
            fontSize: 16,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          جاري التحميل...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* الشعار والعنوان */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: "#2563eb",
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Image
                source={{
                  uri: "https://ucarecdn.com/2d35ff43-a505-4b03-80df-f66fd4eabaaa/-/format/auto/",
                }}
                style={{ width: 70, height: 70 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#1f2937",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              نظام إبراهيم للمحاسبة
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              نظام شامل لإدارة الحسابات والمخزون
            </Text>
          </View>

          {/* نموذج تسجيل الدخول */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "#1f2937",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              تسجيل الدخول
            </Text>

            {/* اسم المستخدم */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                اسم المستخدم
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  backgroundColor: "#fff",
                }}
              >
                <User size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: "#111827",
                    textAlign: "right",
                  }}
                  value={formData.username}
                  onChangeText={(text) =>
                    setFormData({ ...formData, username: text })
                  }
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* كلمة المرور */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                كلمة المرور
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  backgroundColor: "#fff",
                }}
              >
                <Lock size={20} color="#9ca3af" style={{ marginLeft: 12 }} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    fontSize: 16,
                    color: "#111827",
                    textAlign: "right",
                  }}
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ marginRight: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9ca3af" />
                  ) : (
                    <Eye size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* زر تسجيل الدخول */}
            <TouchableOpacity
              style={{
                backgroundColor: isLoginLoading ? "#9ca3af" : "#2563eb",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
              }}
              onPress={handleLogin}
              disabled={isLoginLoading}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {isLoginLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Text>
            </TouchableOpacity>

            {/* معلومات النظام */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                padding: 16,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                مرحباً بك في نظام إبراهيم للمحاسبة
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                نظام متكامل لإدارة الحسابات والمخزون والموظفين مع دعم العملات
                المتعددة
              </Text>
            </View>
          </View>

          {/* معلومات الاتصال */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              اتصل بنا
            </Text>

            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Mail size={18} color="#6b7280" style={{ marginLeft: 8 }} />
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  systemibrahem@gmail.com
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Phone size={18} color="#6b7280" style={{ marginLeft: 8 }} />
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  +963 994 054 027
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: "#16a34a",
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={openWhatsApp}
              >
                <Text style={{ fontSize: 16, marginLeft: 8 }}>📱</Text>
                <Text
                  style={{ color: "white", fontSize: 14, fontWeight: "500" }}
                >
                  واتساب
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* خطط الاشتراك */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1f2937",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              خطط الاشتراك
            </Text>

            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 14, color: "#6b7280" }}>شهري</Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#2563eb" }}
                >
                  5$
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 14, color: "#6b7280" }}>6 أشهر</Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#2563eb" }}
                >
                  30$
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 14, color: "#6b7280" }}>سنوي</Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#16a34a" }}
                >
                  40$
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={openWhatsAppUpgrade}
              style={{
                marginTop: 12,
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#2563eb",
                  textDecorationLine: "underline",
                }}
              >
                اتصل بنا للاشتراك أو الترقية
              </Text>
            </TouchableOpacity>
          </View>

          {/* حقوق الطبع */}
          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 16,
            }}
          >
            © 2025 نظام إبراهيم للمحاسبة. جميع الحقوق محفوظة.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
