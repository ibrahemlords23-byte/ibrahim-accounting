import jwt from "jsonwebtoken";
import sql from "@/app/api/utils/sql";

const JWT_SECRET = process.env.AUTH_SECRET || "ibrahim-accounting-secret-key";
const JWT_EXPIRES_IN = "1h";

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return Response.json({ error: "رمز التحديث مطلوب" }, { status: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      return Response.json({ error: "رمز التحديث غير صالح" }, { status: 401 });
    }

    // جلب بيانات المستخدم
    const users = await sql`
      SELECT u.*, s.name as store_name, s.is_active as store_active,
             s.subscription_expires_at as store_subscription_expires_at
      FROM users u
      JOIN stores s ON u.store_id = s.id
      WHERE u.id = ${decoded.userId} AND u.is_active = true
    `;

    if (users.length === 0) {
      return Response.json({ error: "المستخدم غير موجود" }, { status: 401 });
    }

    const user = users[0];

    // التحقق من انتهاء الاشتراك
    const now = new Date();
    const userExpiry = user.subscription_expires_at
      ? new Date(user.subscription_expires_at)
      : null;
    const storeExpiry = user.store_subscription_expires_at
      ? new Date(user.store_subscription_expires_at)
      : null;

    if (userExpiry && userExpiry < now) {
      return Response.json({ error: "انتهت صلاحية حسابك" }, { status: 403 });
    }

    if (storeExpiry && storeExpiry < now) {
      return Response.json(
        { error: "انتهت صلاحية اشتراك المتجر" },
        { status: 403 },
      );
    }

    // إنشاء access token جديد
    const tokenPayload = {
      userId: user.id,
      storeId: user.store_id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return Response.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        permissions: user.permissions,
        locale: user.locale,
        darkMode: user.dark_mode,
        storeId: user.store_id,
        storeName: user.store_name,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return Response.json({ error: "خطأ في تحديث الرمز" }, { status: 500 });
  }
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "رمز الوصول مطلوب" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const users = await sql`
      SELECT u.*, s.name as store_name
      FROM users u
      JOIN stores s ON u.store_id = s.id
      WHERE u.id = ${decoded.userId} AND u.is_active = true
    `;

    if (users.length === 0) {
      return Response.json({ error: "المستخدم غير موجود" }, { status: 401 });
    }

    const user = users[0];

    return Response.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        permissions: user.permissions,
        locale: user.locale,
        darkMode: user.dark_mode,
        storeId: user.store_id,
        storeName: user.store_name,
      },
    });
  } catch (error) {
    return Response.json({ error: "رمز الوصول غير صالح" }, { status: 401 });
  }
}
