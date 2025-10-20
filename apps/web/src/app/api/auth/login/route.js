import sql from "@/app/api/utils/sql";
import { hash, verify } from "argon2";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET || 'ibrahim-accounting-secret-key';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم
    const users = await sql`
      SELECT u.*, s.name as store_name, s.is_active as store_active, 
             s.subscription_expires_at as store_subscription_expires_at
      FROM users u
      JOIN stores s ON u.store_id = s.id
      WHERE u.username = ${username} AND u.is_active = true
    `;

    if (users.length === 0) {
      return Response.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const user = users[0];

    // التحقق من انتهاء اشتراك المستخدم أو المتجر
    const now = new Date();
    const userExpiry = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const storeExpiry = user.store_subscription_expires_at ? new Date(user.store_subscription_expires_at) : null;

    if (userExpiry && userExpiry < now) {
      return Response.json(
        { error: 'انتهت صلاحية حسابك. يرجى تجديد الاشتراك' },
        { status: 403 }
      );
    }

    if (storeExpiry && storeExpiry < now) {
      return Response.json(
        { error: 'انتهت صلاحية اشتراك المتجر. يرجى تجديد الاشتراك' },
        { status: 403 }
      );
    }

    if (!user.store_active) {
      return Response.json(
        { error: 'المتجر غير نشط' },
        { status: 403 }
      );
    }

    // التحقق من كلمة المرور
    try {
      const isValidPassword = await verify(user.password_hash, password);
      if (!isValidPassword) {
        return Response.json(
          { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return Response.json(
        { error: 'خطأ في التحقق من كلمة المرور' },
        { status: 500 }
      );
    }

    // إنشاء JWT tokens
    const tokenPayload = {
      userId: user.id,
      storeId: user.store_id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // تسجيل محاولة تسجيل الدخول
    await sql`
      INSERT INTO audit_logs (store_id, user_id, action, entity_type, entity_id, new_data, ip_address)
      VALUES (
        ${user.store_id}, 
        ${user.id}, 
        'login', 
        'user', 
        ${user.id},
        ${JSON.stringify({ username: user.username })},
        ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'}
      )
    `;

    // إرسال البيانات
    return Response.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        permissions: user.permissions,
        locale: user.locale,
        darkMode: user.dark_mode,
        storeId: user.store_id,
        storeName: user.store_name
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}